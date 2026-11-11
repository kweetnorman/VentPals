(function(){
'use strict';
var KEY='ventpals_logged_in',LAST='ventpals_last_url',ACTIVITY='ventpals_demo_last_activity';
var IDLE_LIMIT=5*60*1000;
if(localStorage.getItem(KEY)!=='true')return;
function root(){var p=location.pathname.split('/').filter(Boolean);return p.length>1?'../'.repeat(p.length-1):'';}
var path=location.pathname,skip=['/login','/signup','/set-pin','/app-switcher','/onboarding'];
if(!skip.some(function(s){return path.indexOf(s)!==-1;}))localStorage.setItem(LAST,location.href);
function logout(){localStorage.removeItem(KEY);localStorage.removeItem(ACTIVITY);location.href=root()+'welcome.html';}
function readActivity(){var n=Number(localStorage.getItem(ACTIVITY));return Number.isFinite(n)&&n>0?n:Date.now();}
function recordActivity(){
 var now=Date.now();
 if(now-readActivity()>=IDLE_LIMIT){logout();return;}
 localStorage.setItem(ACTIVITY,String(now));
}
function checkIdle(){if(Date.now()-readActivity()>=IDLE_LIMIT)logout();}
if(!localStorage.getItem(ACTIVITY))localStorage.setItem(ACTIVITY,String(Date.now()));
['pointerdown','keydown','touchstart','scroll','click'].forEach(function(type){
 document.addEventListener(type,recordActivity,{passive:true});
});
window.addEventListener('storage',function(e){if(e.key===ACTIVITY)checkIdle();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkIdle();});
var idleCheck=window.setInterval(checkIdle,1000);
window.addEventListener('pagehide',function(){window.clearInterval(idleCheck);});
function inject(){
 if(document.getElementById('vp-tabbar'))return;
 var base=root(),file=(location.pathname.split('/').pop()||'').replace('.html','');
 var tabs=[
  {href:'nest.html',icon:'🪺',label:'My Nest',match:['nest','dashboard','circle']},
  {href:'start-with-a-feeling.html',icon:'💜',label:'Feelings',match:['feeling','start-with-a-feeling']},
  {href:'world.html',icon:'🌎',label:'Explore',match:['world']},
  {href:'meet-the-flock.html',icon:'🐦',label:'Flockopedia',match:['meet-the-flock','meet-the-birds']},
  {href:'profile.html',icon:'😊',label:'Me',match:['profile','settings']}
 ];
 var bar=document.createElement('nav');bar.id='vp-tabbar';bar.setAttribute('aria-label','VentPals navigation');
 bar.style.cssText='position:fixed;left:10px;right:10px;bottom:8px;z-index:9999;display:flex;justify-content:space-around;align-items:center;gap:4px;max-width:760px;margin:auto;background:rgba(255,255,255,.97);border:1px solid rgba(118,81,181,.14);border-radius:25px;box-shadow:0 8px 28px rgba(46,26,71,.16);padding:7px 6px calc(7px + env(safe-area-inset-bottom));font-family:inherit;backdrop-filter:blur(12px)';
 function add(href,icon,label,active,action){
  var el=document.createElement(action?'button':'a');if(!action)el.href=href;else el.type='button';
  el.style.cssText='flex:1;min-width:0;max-width:112px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:54px;padding:5px 2px;border:0;border-radius:18px;background:'+(active?'#f0eaff':'transparent')+';color:'+(active?'#6845a0':'#655d70')+';cursor:pointer;text-decoration:none;font:700 10px/1.15 system-ui,sans-serif';
  var ico=document.createElement('span');ico.textContent=icon;ico.style.fontSize='20px';ico.setAttribute('aria-hidden','true');
  var txt=document.createElement('span');txt.textContent=label;el.appendChild(ico);el.appendChild(txt);
  if(action)el.addEventListener('click',action);return el;
 }
 tabs.forEach(function(t){bar.appendChild(add(base+t.href,t.icon,t.label,t.match.some(function(m){return file.indexOf(m)!==-1;})));});
 var out=add('','🚪','Log out',false,logout);out.id='vp-logout-btn';out.setAttribute('aria-label','Log out of VentPals');bar.appendChild(out);
 document.body.appendChild(bar);document.body.style.paddingBottom='105px';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
window.VPSession={logout:logout,isLoggedIn:true,idleTimeoutMs:IDLE_LIMIT};
})();