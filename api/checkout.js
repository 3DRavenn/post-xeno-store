import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body;

    // Match your frontend IDs to actual Stripe Price IDs:
    const priceMap = {
      "belt-chain": "price_1SHSXpE1zq0iMeIXs0rAL10b",
      "fur-jacket": "price_1SHSXoE1zq0iMeIX4OxDS0SV",
      "fallen-angel-tee-black": "price_1SHSXnE1zq0iMeIXLhpoBQbI",
      "fallen-angel-tee-grey": "price_1SHSXlE1zq0iMeIX5rd4Xqze"
    };

    const lineItems = items.map(item => ({
      price: priceMap[item.id],
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
