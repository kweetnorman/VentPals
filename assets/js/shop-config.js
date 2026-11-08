/**
 * shop-config.js: the ONLY file you need to edit to connect the Shopify store.
 *
 * 1. domain      your store's myshopify.com domain (already filled in below)
 * 2. variantId   for each keepsake: Shopify admin > Products > (product) > the variant's ID.
 *                It is the long number at the end of the variant URL, e.g. 44123456789012.
 *                Leave '' until you have it; the grown-up page will warn that it isn't connected yet.
 * 3. cost        how many Feathers (the in-app currency) the child needs. Tune freely.
 * 4. discountCode  optional. If you create a 100%-off code in Shopify for earned keepsakes,
 *                put it here and it is applied automatically at checkout.
 * 5. orderWebhook  optional. A URL (Zapier, Shopify Flow, a Cloud Function) that receives the
 *                approved request as JSON. This is what makes the order fully automatic, with
 *                no checkout step. Leave '' to use the cart-link flow.
 */
window.VP_SHOP = {
  domain: 'ventpals-keepsakes-marketplace.myshopify.com',
  discountCode: '',
  orderWebhook: '',
  items: [
    { id: 'sticker',    name: 'VentPals Sticker',    emoji: '⭐', image: 'assets/images/keepsakes-sticker.png',    cost: 15,  variantId: '', blurb: 'A sticker of your bird to stick anywhere that needs a little calm.' },
    { id: 'pins',       name: 'VentPals Pins',       emoji: '📌', image: 'assets/images/keepsakes-pins.png',       cost: 30,  variantId: '', blurb: 'Enamel pins to wear your favorite bird on a bag or jacket.' },
    { id: 'journal',    name: 'VentPals Journal',    emoji: '📓', image: 'assets/images/keepsakes-journal.png',    cost: 50,  variantId: '', blurb: 'A place to write down feelings, thoughts, and proud moments.' },
    { id: 'mug',        name: 'VentPals Mug',        emoji: '☕', image: 'assets/images/keepsakes-mug.png',        cost: 70,  variantId: '', blurb: 'A cozy mug for cocoa, tea, or a quiet moment.' },
    { id: 'tee',        name: 'VentPals T-Shirt',    emoji: '👕', image: 'assets/images/keepsakes-tee.png',        cost: 100, variantId: '', blurb: 'A soft tee featuring your VentPal bird.' },
    { id: 'sweatshirt', name: 'VentPals Sweatshirt', emoji: '🧥', image: 'assets/images/keepsakes-sweatshirt.png', cost: 140, variantId: '', blurb: 'The coziest way to show your VentPal pride.' }
  ]
};
