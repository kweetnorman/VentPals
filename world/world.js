// world.js — VentPals World Zone Navigation
const zones = {
  'nesting-tree':    { name: 'Nesting Tree',    emoji: '🌳', desc: 'A cozy place to rest and reflect. Your home base.' },
  'feelings-forest': { name: 'Feelings Forest', emoji: '🌲', desc: 'Explore the forest of your emotions. Find the feeling that matches you.' },
  'quiet-caves':     { name: 'Quiet Caves',     emoji: '🏔️', desc: 'A quiet space for deep thinking and peaceful reflection.' },
  'firefly-meadow':  { name: 'Firefly Meadow',  emoji: '✨', desc: 'Sparkling with hope and wonder. Come here when you feel hopeful.' },
  'sky-bridge':      { name: 'Sky Bridge',      emoji: '🌈', desc: 'Cross into new possibilities and see things from a higher view.' },
  'sparkle-stream':  { name: 'Sparkle Stream',  emoji: '💧', desc: 'Let your worries flow away. Calm your feelings here.' },
};

Object.entries(zones).forEach(([id, zone]) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const msg = zone.emoji + '  ' + zone.name + '\n\n' + zone.desc + '\n\nThis zone is coming soon — check back as VentPals grows!';
    alert(msg);
  });
  btn.setAttribute('title', zone.name + ' — ' + zone.desc);
});
