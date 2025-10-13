// api/checkout.js  (CommonJS)

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Map your frontend ids -> Stripe Price IDs
    const priceMap = {
      'belt-chain': 'price_1SHSXpE1zq0iMeIXs0rAL10b',
      'fur-jacket': 'price_1SHSXoE1zq0iMeIX4OxDS0SV',
      'fallen-angel-tee-black': 'price_1SHSXnE1zq0iMeIXLhpoBQbI',
      'fallen-angel-tee-grey': 'price_1SHSXlE1zq0iMeIX5rd4Xqze',
    };

    // Build line items safely
    const lineItems = items.map((it, idx) => {
      const price = priceMap[it.id];
      const quantity = Number(it.quantity) || 1;
      if (!price) {
        throw new Error(`Unknown item id at index ${idx}: ${it.id}`);
      }
      return { price, quantity };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    // Expose a short reason for easier debugging in Network panel
    return res.status(500).json({ error: 'Internal Server Error', detail: String(err.message || err) });
  }
};
