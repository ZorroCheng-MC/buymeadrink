import { createClient } from "@vercel/kv";

// Initialize KV storage client
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

let lastLogTime = Date.now();

export default async function handler(req, res) {
  const currentTime = Date.now();
  if (currentTime - lastLogTime > 5000) {
    console.log(`Received ${req.method} request to ${req.url}`);
    lastLogTime = currentTime;
  }

  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const orders = (await kv.get("orders")) || [];
      const totalSpent = (await kv.get("totalSpent")) || 0;
      const timeLeft = (await kv.get("timeLeft")) || 1700;
      console.log("Sending current state:", { orders, totalSpent, timeLeft });
      res.status(200).json({ orders, totalSpent, timeLeft });
    } else if (req.method === "POST") {
      const newOrder = req.body;
      console.log("Received new order:", newOrder);

      const orders = (await kv.get("orders")) || [];
      orders.push(newOrder);
      await kv.set("orders", orders);

      const totalSpent = ((await kv.get("totalSpent")) || 0) + newOrder.price;
      await kv.set("totalSpent", totalSpent);

      console.log("Updated state:", { orders, totalSpent });
      res
        .status(201)
        .json({
          message: "Order added successfully",
          orderCount: orders.length,
        });
    } else if (req.method === "PUT") {
      const { timeLeft } = req.body;
      await kv.set("timeLeft", timeLeft);
      console.log(`Updated timeLeft to ${timeLeft}`);
      res.status(200).json({ message: "Time updated successfully", timeLeft });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
