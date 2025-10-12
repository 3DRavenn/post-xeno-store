// File: api/checkout.js
// Vercel serverless function — CommonJS
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    // Build base URL from env (recommended) or from headers as fallback
    const baseUrl = process.env.PUBLIC_BASE_URL ||
      `${(req.headers['x-forwarded-proto'] || 'https')}://${req.headers.host}`;

    const line_items = items.map(i => ({
      price_data: {
        currency: 'jpy',
        unit_amount: i.unit_amount, // in yen * 100 already on client
        product_data: { name: i.name }
      },
      quantity: i.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${baseUrl}/success.html`,
      cancel_url: `${baseUrl}/`,
      shipping_address_collection: {
        allowed_countries: ['JP','US','CA','GB','AU','DE','FR','NL','SE','IT','ES','KR','SG','HK']
      },
      phone_number_collection: { enabled: false },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Stripe error' });
  }
};
