// /api/checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const origin = req.headers.origin || `https://${req.headers.host}`;

    // TEMP TEST: Create a checkout session for one test product
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: "REPLACE_WITH_YOUR_PRICE_ID", // e.g. price_12345 from Stripe dashboard
          quantity: 1,
        },
      ],
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Checkout failed" });
  }
}
