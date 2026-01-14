import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY env var' });
    }

    // Map storefront ids → LIVE Stripe price IDs
    const priceMap = {
      'belt-chain': 'price_1SHSXpE1zq0iMeIXs0rAL10b',
      'fur-jacket': 'price_1SHSXoE1zq0iMeIX4OxDS0SV',
      'fallen-angel-tee-black': 'price_1SHSXnE1zq0iMeIXLhpoBQbI',
      'fallen-angel-tee-grey': 'price_1SHSXlE1zq0iMeIX5rd4Xqze',
    };

    const body = req.body;
    if (!body || !Array.isArray(body.items)) {
      return res.status(400).json({ error: 'Bad request: items[] missing' });
    }

    const line_items = body.items.map(({ id, quantity }) => {
      const price = priceMap[id];
      if (!price) {
        throw new Error(`Unknown item id: ${id}`);
      }
      const qty = Math.max(1, Number(quantity) || 1);
      return { price, quantity: qty };
    });

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,

      // Force shipping address collection
      shipping_address_collection: {
        allowed_countries: [
          'JP',
          'US', 'CA',
          'GB', 'DE', 'FR', 'NL', 'IT', 'ES',
          'AU',
        ],
      },

      // ONE global flat-rate shipping (applied once per order)
      shipping_options: [
        { shipping_rate: 'shr_1SpXZnE1zq0iMeIXSSThuKPC' }, // Standard Shipping ¥3,750
      ],

      // Recommended
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },

      success_url: 'https://postxeno.com/success.html',
      cancel_url: 'https://postxeno.com/',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return res.status(500).json({
      error: err?.message || 'internal',
      code: err?.type || undefined,
    });
  }
}
