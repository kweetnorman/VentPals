/**
 * Show -> app links for Mimbleton.
 * Add one entry per YouTube episode. Nothing else needs to change.
 *   id       short slug, used in the link: world.html?episode=<id>
 *   title    episode title shown on the "From the show" ribbon
 *   place    habitat id (nesting-tree, feelings-forest, quiet-caves, firefly-meadow, sky-bridge, sparkle-stream)
 *   home     optional bird id (clover, pebble, twig, aura, breezy, flicker, drift, echo, sable, lumen,
 *            flamez, flare, solace, nova, guardian, cove) to open that bird's home
 *   tool     optional app page the episode teaches, e.g. 'breathing.html'
 *   youtube  full YouTube URL (a "Watch the episode" button appears when this is set)
 * Example:
 *   { id:'ep01-welcome', title:'Welcome to Mimbleton', place:'nesting-tree', home:'clover', tool:'nest.html', youtube:'https://youtu.be/XXXX' }
 */
window.VP_EPISODES = [];
