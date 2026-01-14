// /api/checkout.mjs (works as .js too because package.json has "type":"module")
import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY env var' });
    }

    // Map your storefront ids → LIVE Stripe price IDs
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

    const hasJacket = body.items.some((i) => i.id === 'fur-jacket');
    const hasShirt =
      body.items.some((i) => i.id === 'fallen-angel-tee-black') ||
      body.items.some((i) => i.id === 'fallen-angel-tee-grey');

    const sessionConfig = {
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
    };

    // Size selectors (shown only when relevant items are in the cart)
    // Saved on the Checkout Session under custom_fields.
    const sizeOptions = [
      { label: 'Small', value: 'S' },
      { label: 'Medium', value: 'M' },
      { label: 'Large', value: 'L' },
    ];

    const customFields = [];

    if (hasJacket) {
      customFields.push({
        key: 'jacket_size',
        label: { type: 'custom', custom: 'Jacket Size' },
        type: 'dropdown',
        dropdown: { options: sizeOptions },
        optional: false,
      });
    }

    if (hasShirt) {
      customFields.push({
        key: 'shirt_size',
        label: { type: 'custom', custom: 'T‑Shirt Size' },
        type: 'dropdown',
        dropdown: { options: sizeOptions },
        optional: false,
      });
    }

    if (customFields.length) {
      sessionConfig.custom_fields = customFields;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    // make the error visible in Vercel logs *and* to the client
    console.error('checkout error:', err);
    return res.status(500).json({
      error: err?.message || 'internal',
      code: err?.type || undefined,
    });
  }
}
