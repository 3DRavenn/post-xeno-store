// api/checkout.js (CommonJS)
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


/**
 * Expects { items: [{ id: string, quantity: number }] }
 * where ids are the data-id values from index.html
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items" });
    }

    const priceMap = {
      "belt-chain": "price_1SHSXpE1zq0iMeIXs0rAL10b",
      "fur-jacket": "price_1SHSXoE1zq0iMeIX4OxDS0SV",
      "fallen-angel-tee-black": "price_1SHSXnE1zq0iMeIXLhpoBQbI",
      "fallen-angel-tee-grey":  "price_1SHSXlE1zq0iMeIX5rd4Xqze"
    };

    const line_items = [];
    for (const { id, quantity } of items) {
      const price = priceMap[id];
      const qty = Math.max(1, Number(quantity || 1));
      if (!price) return res.status(400).json({ error: `Unknown item id: ${id}` });
      line_items.push({ price, quantity: qty });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      payment_method_types: ["card"],
      success_url: "https://www.postxeno.com/success.html",
      cancel_url:  "https://www.postxeno.com/"
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: "Stripe session creation failed" });
  }
};
