// vp-auth.js — VentPals accounts (parent-owned model)
//
//   Firebase Auth user  = the grown-up (email + password)
//   parents/{uid}                  = grown-up record + consent
//   parents/{uid}/children/{id}    = one profile per child (nickname, bird, salted PIN hash)
//
// Kids never have an email or password. On a family device the grown-up is signed in,
// and each child picks their profile and types a 4-digit code. The code is a profile lock
// (like Netflix profiles) — the real security boundary is the grown-up's Firebase login
// plus the Firestore rules in firestore.rules.

import { auth, firestore } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc, serverTimestamp, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export const CONSENT_VERSION = '2026-11-06';
const PIN_ITERATIONS = 100000;
const GATE_MINUTES = 10;
const MAX_PIN_TRIES = 5;
const LOCK_SECONDS = 60;

/* ───────── helpers ───────── */

export function onParent(cb) { return onAuthStateChanged(auth, cb); }
export function currentParent() { return auth.currentUser; }

export function friendlyAuthError(err) {
  const code = (err && err.code) || '';
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
    'auth/invalid-email': 'That email address does not look right.',
    'auth/weak-password': 'Please choose a longer password (at least 8 characters).',
    'auth/missing-password': 'Please enter your password.',
    'auth/invalid-credential': 'Email or password is not right. Please try again.',
    'auth/wrong-password': 'Email or password is not right. Please try again.',
    'auth/user-not-found': 'Email or password is not right. Please try again.',
    'auth/too-many-requests': 'Too many tries. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Could not reach the internet. Check your connection and try again.',
    'auth/operation-not-allowed': 'Email sign-in is not turned on yet in Firebase (Authentication → Sign-in method).',
    'permission-denied': 'Permission denied. The Firestore rules may not be published yet.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function unb64(str) { return Uint8Array.from(atob(str), c => c.charCodeAt(0)); }

/* ───────── PIN hashing (PBKDF2-SHA256 via WebCrypto) ───────── */

export async function makePin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: b64(salt), hash: await derive(pin, salt, PIN_ITERATIONS), iter: PIN_ITERATIONS };
}

async function derive(pin, saltBytes, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' }, key, 256);
  return b64(bits);
}

export async function checkPin(child, pin) {
  if (!child || !child.pin) return false;
  const h = await derive(pin, unb64(child.pin.salt), child.pin.iter || PIN_ITERATIONS);
  return h === child.pin.hash;
}

// Simple lockout so a sibling cannot guess codes all day (per-device, per-child).
export function lockState(childId) {
  try {
    const s = JSON.parse(localStorage.getItem('vp_lock_' + childId) || '{}');
    if (s.until && Date.now() < s.until) return { locked: true, seconds: Math.ceil((s.until - Date.now()) / 1000) };
  } catch (e) {}
  return { locked: false, seconds: 0 };
}
export function recordPinFailure(childId) {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('vp_lock_' + childId) || '{}'); } catch (e) {}
  s.tries = (s.tries || 0) + 1;
  if (s.tries >= MAX_PIN_TRIES) { s = { tries: 0, until: Date.now() + LOCK_SECONDS * 1000 }; }
  localStorage.setItem('vp_lock_' + childId, JSON.stringify(s));
  return lockState(childId);
}
export function clearPinFailures(childId) { localStorage.removeItem('vp_lock_' + childId); }

/* ───────── grown-up accounts ───────── */

export async function signUpParent({ email, password, firstName, lastName, relationship }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: firstName });
  await setDoc(doc(firestore, 'parents', cred.user.uid), {
    firstName, lastName, relationship, email,
    consent: { acceptedAt: serverTimestamp(), version: CONSENT_VERSION },
    createdAt: serverTimestamp(),
  });
  openGate();
  return cred.user;
}

export async function logInParent(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  openGate();
  return cred.user;
}

export function resetPassword(email) { return sendPasswordResetEmail(auth, email); }

export async function getParentDoc(uid) {
  const snap = await getDoc(doc(firestore, 'parents', uid));
  return snap.exists() ? snap.data() : null;
}

// Fully log out the grown-up AND clear any child session on this device.
export async function logOutEverything() {
  deactivateChild();
  sessionStorage.removeItem('vp_gate_until');
  localStorage.removeItem('ventpals_parent_logged_in');
  localStorage.removeItem('ventpals_parent_email');
  await signOut(auth);
}

/* ───────── grown-up gate (keeps kids out of the family page) ───────── */

export function openGate() {
  sessionStorage.setItem('vp_gate_until', String(Date.now() + GATE_MINUTES * 60000));
  localStorage.setItem('ventpals_parent_logged_in', 'true');
  if (auth.currentUser) localStorage.setItem('ventpals_parent_email', auth.currentUser.email || '');
  deactivateChild(); // a grown-up is here now, so no child session stays open
}
export function gateIsOpen() {
  const until = Number(sessionStorage.getItem('vp_gate_until') || 0);
  return Date.now() < until && localStorage.getItem('ventpals_logged_in') !== 'true';
}
export async function passGate(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('not-signed-in');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  openGate();
}

/* ───────── child profiles ───────── */

function childrenCol(uid) { return collection(firestore, 'parents', uid, 'children'); }

export async function listChildren(uid) {
  const snap = await getDocs(query(childrenCol(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addChild(uid, { nickname, ageBand, pin }) {
  const ref = await addDoc(childrenCol(uid), {
    nickname, ageBand,
    pin: await makePin(pin),
    birdId: null, birdName: null, birdEmoji: null, avatarColour: null,
    stage: 'baby', onboardingComplete: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setChildPin(uid, childId, pin) {
  await updateDoc(doc(firestore, 'parents', uid, 'children', childId), { pin: await makePin(pin) });
}

export async function removeChild(uid, childId) {
  await deleteDoc(doc(firestore, 'parents', uid, 'children', childId));
  localStorage.removeItem('vp_stash_' + childId);
}

export async function saveChildProfile(uid, childId, fields) {
  const allowed = ['birdId', 'birdName', 'birdEmoji', 'avatarColour', 'pronouns', 'powerWord', 'displayName', 'stage', 'onboardingComplete'];
  const clean = {};
  allowed.forEach(k => { if (fields[k] !== undefined) clean[k] = fields[k]; });
  await updateDoc(doc(firestore, 'parents', uid, 'children', childId), clean);
}

/* ───────── bridge to the existing pages ─────────
   The kid pages read ventpals_user / ventpals_logged_in from localStorage. We keep those
   working, and keep each child's on-device journal entries separate (stash/restore). */

const CHILD_DATA_KEYS = () => Object.keys(localStorage).filter(k =>
  k === 'ventpals_reflections' || k.indexOf('ventpals_reflection_') === 0);

function stashCurrentChild() {
  const prev = localStorage.getItem('ventpals_child_id');
  if (!prev) return;
  const bag = {};
  CHILD_DATA_KEYS().forEach(k => { bag[k] = localStorage.getItem(k); });
  localStorage.setItem('vp_stash_' + prev, JSON.stringify(bag));
}

export function activateChild(parentUid, child) {
  const prev = localStorage.getItem('ventpals_child_id');
  if (prev !== child.id) {
    stashCurrentChild();
    CHILD_DATA_KEYS().forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('ventpals_last_url');
    try {
      const bag = JSON.parse(localStorage.getItem('vp_stash_' + child.id) || '{}');
      Object.keys(bag).forEach(k => localStorage.setItem(k, bag[k]));
    } catch (e) {}
  }
  const user = {
    childId: child.id, parentUid,
    username: child.nickname, nickname: child.nickname, firstName: child.nickname,
    age: child.ageBand, hasPin: true,
    birdId: child.birdId, birdName: child.birdName, birdEmoji: child.birdEmoji,
    avatarColour: child.avatarColour, pronouns: child.pronouns, powerWord: child.powerWord,
    displayName: child.displayName || child.nickname,
    stage: child.stage || 'baby', status: 'active',
  };
  localStorage.setItem('ventpals_child_id', child.id);
  localStorage.setItem('ventpals_parent_uid', parentUid);
  localStorage.setItem('ventpals_user', JSON.stringify(user));
  localStorage.setItem('ventpals_logged_in', 'true');
  if (child.onboardingComplete) localStorage.setItem('ventpals_onboarding_complete', 'true');
  else localStorage.removeItem('ventpals_onboarding_complete');
}

export function deactivateChild() {
  localStorage.removeItem('ventpals_logged_in');
}

export function activeChildIds() {
  return {
    childId: localStorage.getItem('ventpals_child_id'),
    parentUid: localStorage.getItem('ventpals_parent_uid'),
  };
}
