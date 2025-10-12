// api/checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Map your on-page product IDs -> Stripe Price IDs (LIVE)
const PRICE_MAP = {
  "belt-chain": "price_1SHSXpE1zq0iMeIXs0rAL10b",
  "fur-jacket": "price_1SHSXoE1zq0iMeIX4OxDS0SV",
  "fallen-angel-tee-black": "price_1SHSXnE1zq0iMeIXLhpoBQbI",
  "fallen-angel-tee-grey": "price_1SHSXlE1zq0iMeIX5rd4Xqze",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items" });
    }

    const line_items = [];
    for (const it of items) {
      const price = PRICE_MAP[it.id];
      const qty = Number(it.quantity) || 0;
      if (!price || qty < 1) continue;
      line_items.push({ price, quantity: qty });
    }
    if (line_items.length === 0) {
      return res.status(400).json({ error: "No valid items" });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/`,
      // Optional:
      // locale: "ja",
      // shipping_address_collection: { allowed_countries: ["JP"] },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Checkout failed" });
  }
}
