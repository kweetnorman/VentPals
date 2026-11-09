/**
 * shop-config.js: the ONLY file you need to edit to connect the Shopify store.
 *
 * items         every keepsake VentPals can send. `id` must match the ids used in growth.js (MILESTONES).
 *   variantId   Shopify admin > Products > (product) > the variant's ID: the long number at the end
 *               of the variant URL, e.g. 44123456789012. Leave '' until you have it.
 *   price       what a grown-up pays when buying it themselves from the store (display only)
 * orderWebhook  optional URL (Zapier, Shopify Flow, a Cloud Function). When a grown-up confirms the
 *               shipping address for an earned keepsake, the order (with address) is POSTed here so the
 *               store can create and fulfil it with no checkout. Leave '' to fulfil by hand from the
 *               grown-up's confirmation.
 * discountCode  optional 100%-off code for the manual cart link.
 */
window.VP_SHOP = {
  domain: 'ventpals-keepsakes-marketplace.myshopify.com',
  storefront: 'https://keepsakes.ventpals.com',
  discountCode: '',
  orderWebhook: '',
  items: [
    { id: 'stickers',  name: 'Bug & Feather Sticker Sheet', emoji: '✨', image: 'assets/images/keepsakes-sticker.png',    variantId: '', price: '', blurb: 'Fireflies, bugs, and feathers to mark milestones in the journal.' },
    { id: 'pin',       name: 'VentPals Bird Pin',           emoji: '📌', image: 'assets/images/keepsakes-pins.png',       variantId: '', price: '', blurb: 'An enamel pin of your own bird for a backpack or jacket.' },
    { id: 'pen',       name: 'VP Pen',                      emoji: '🖊️', image: '',        variantId: '', price: '', blurb: 'VentPals colors, with "I fly with ___" on the barrel.' },
    { id: 'hourglass', name: 'Conversation Hourglass',      emoji: '⏳', image: '',  variantId: '', price: '', blurb: 'A gentle tool for taking turns and slowing down hard conversations.' },
    { id: 'journal',   name: 'Circles Journal',             emoji: '📓', image: '',    variantId: '', price: '', blurb: 'Your bird on the cover and reflection prompts inside.' },
    { id: 'case',      name: 'Emotional Tools Case',        emoji: '🧰', image: '',       variantId: '', price: '', blurb: 'A carry case for your whole VentPals toolkit.' }
  ]
};
