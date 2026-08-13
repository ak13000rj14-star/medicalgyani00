import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Webhook is running");
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
        error: "Invalid signature"
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

      const chatId =
        paymentLink?.notes?.telegram_chat_id;

      if (!chatId) {
        console.log("Telegram chat ID not found");
        return res.status(200).json({ ok: true });
      }

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "💬 Chat with Medical Gyani",
              url: "https://t.me/ak1300kom"
            }
          ]
        ]
      };

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              "✅ Payment Successful!\n\n" +
              "आपका ₹30 payment verify हो गया है।\n\n" +
              "अब अपनी medicine/query के लिए मुझसे directly बात करें 👇",
            reply_markup: keyboard
          })
        }
      );

      console.log("Payment approved:", {
        paymentId: payment?.id,
        chatId
      });
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
