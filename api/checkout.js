// /api/checkout.js (ESM)
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items" });
    }

    // must match data-id values in the HTML
    const priceMap = {
      "belt-chain": "price_1SHSXpE1zq0iMeIXs0rAL10b",
      "fur-jacket": "price_1SHSXoE1zq0iMeIX4OxDS0SV",
      "fallen-angel-tee-black": "price_1SHSXnE1zq0iMeIXLhpoBQbI",
      "fallen-angel-tee-grey": "price_1SHSXlE1zq0iMeIX5rd4Xqze",
    };

    const line_items = items.map(({ id, quantity }) => {
      const price = priceMap[id];
      if (!price) throw new Error(`Unknown item id: ${id}`);
      return { price, quantity: Number(quantity) || 1 };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: "https://postxeno.com/success.html",
      cancel_url: "https://postxeno.com/",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Checkout failed" });
  }
}
