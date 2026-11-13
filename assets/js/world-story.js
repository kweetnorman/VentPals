/**
 * world-story.js: the story of Mimbleton, one chapter per place.
 * EDIT THIS FILE to match your YouTube scripts. Nothing else needs to change.
 *
 *   id        also the background file: assets/world/backgrounds/{id}.jpg
 *   host      which flock member welcomes the child here (any of the 16 bird ids)
 *   beats     what the host says, one bubble per line. {name} = child's name, {bird} = child's bird
 *   activity  a tiny thing to DO in the scene that teaches the matching part of the app
 *   learned   one-line takeaway shown after the activity
 *   cta       where the real app feature lives
 *   episode   paste the YouTube link for this chapter's episode (leave '' to hide the button)
 */
window.VP_STORY = {
  intro: { title: 'Welcome to Mimbleton', lines: [
    'Mimbleton is a gentle place where big feelings are welcome.',
    'Six little places hide here. Each one teaches you a tool that lives in your VentPals app.',
    'Ready to explore with {bird}?'
  ] },
  finale: { title: 'You know Mimbleton!', lines: [
    '{name}, you visited every place and tried every tool.',
    'Whenever a feeling gets big, you and {bird} know where to go.'
  ], cta: { label: 'Check in with a feeling', href: 'start-with-a-feeling.html?mode=check-in' } },
  chapters: [
    { id: 'nesting-tree', place: 'The Nesting Tree', host: 'guardian', activity: 'hello', episode: '',
      beats: ['This is the Nesting Tree. Every VentPal starts here, and so do you.', 'Your bird is yours, and it stays with you as it grows. Say hello to {bird}!'],
      learned: 'Your Nest is your own space. Your bird stays with you as it grows.',
      cta: { label: 'Visit my Nest', href: 'nest.html' } },
    { id: 'feelings-forest', place: 'The Feelings Forest', host: 'solace', activity: 'feelings', episode: '',
      beats: ['The leaves here change color with every feeling.', 'Touch a leaf that matches how you feel. There are no wrong answers.'],
      learned: 'Naming a feeling is the first step. In the app, "Start with a feeling" does this every day.',
      cta: { label: 'Check in with a feeling', href: 'start-with-a-feeling.html?mode=check-in' } },
    { id: 'quiet-caves', place: 'The Quiet Caves', host: 'echo', activity: 'breathe', episode: '',
      beats: ['It is calm in here. Sounds are soft and slow.', 'Let us take three slow breaths together.'],
      learned: 'Slow breathing calms your body. You can do it anywhere, any time.',
      cta: { label: 'Try calming skills', href: 'calming-skills.html' } },
    { id: 'firefly-meadow', place: 'The Firefly Meadow', host: 'lumen', activity: 'fireflies', episode: '',
      beats: ['The fireflies come out when you practice something new.', 'Catch five of them! Gently, they are shy.'],
      learned: 'In the app, practicing and learning earns snacks. Feed {bird} and it grows.',
      cta: { label: 'Feed my bird', href: 'bird-growth.html#feed' } },
    { id: 'sparkle-stream', place: 'The Sparkle Stream', host: 'cove', activity: 'dressup', episode: '',
      beats: ['Look how the water sparkles! Feathers float down this stream.', 'Try something on {bird}. It is only a try-on.'],
      learned: 'Feeding earns feathers. Save them up, then choose what is worth it to you.',
      cta: { label: 'Open the closet', href: 'closet.html' } },
    { id: 'sky-bridge', place: 'The Sky Bridge', host: 'breezy', activity: 'share', episode: '',
      beats: ['From up here you can see everyone who cares about you.', 'Big feelings are easier with a trusted grown-up beside you.'],
      learned: 'You can show a grown-up how you handled a feeling and celebrate it together.',
      cta: { label: 'See my rewards', href: 'rewards.html' } }
  ]
};
