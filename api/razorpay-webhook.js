import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Webhook is running");
  }

  try {
    // Get RAW request body
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const rawBody = Buffer.concat(chunks);

    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      console.error("Missing webhook signature or secret");
      return res.status(400).json({
        ok: false,
        error: "Missing signature or secret",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      console.error("Invalid Razorpay webhook signature");

      return res.status(400).json({
        ok: false,
        error: "Invalid signature",
      });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    console.log("Razorpay event:", event.event);

    if (event.event === "payment_link.paid") {
      const paymentLink =
        event.payload?.payment_link?.entity;

      const payment =
        event.payload?.payment?.entity;

      const chatId =
        paymentLink?.notes?.telegram_chat_id;

      console.log("Telegram chat ID:", chatId);

      if (!chatId) {
        console.error("Telegram chat ID not found in payment link notes");

        return res.status(200).json({
          ok: true,
          message: "Payment received but Telegram chat ID not found",
        });
      }

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "💬 Chat with Medical Gyani",
              url: "https://t.me/ak1300kom",
            },
          ],
        ],
      };

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              "✅ Payment Successful!\n\n" +
              "आपका ₹30 payment verify हो गया है।\n\n" +
              "अब अपनी medicine/query के लिए मुझसे directly बात करें 👇",
            reply_markup: keyboard,
          }),
        }
      );

      const telegramResult = await telegramResponse.json();

      console.log("Telegram response:", telegramResult);

      if (!telegramResponse.ok) {
        console.error("Telegram sendMessage failed:", telegramResult);

        return res.status(500).json({
          ok: false,
          error: "Telegram message failed",
        });
      }

      console.log("Payment approved:", {
        paymentId: payment?.id,
        chatId,
      });
    }

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: "Webhook processing failed",
    });
  }
}
