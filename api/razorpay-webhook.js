import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Razorpay webhook is running");
  }

  try {
    const rawBody =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (
      !signature ||
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return res.status(400).json({
        ok: false,
        error: "Invalid webhook signature"
      });
    }

    const event =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    if (event.event === "payment_link.paid") {
      const paymentLink =
        event.payload?.payment_link?.entity;

      const payment =
        event.payload?.payment?.entity;

      console.log("Payment successful:", {
        paymentLinkId: paymentLink?.id,
        paymentId: payment?.id,
        amount: payment?.amount,
        status: payment?.status
      });

      // Payment verified successfully.
      // Telegram customer mapping will be added next.
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: "Webhook processing failed"
    });
  }
}
