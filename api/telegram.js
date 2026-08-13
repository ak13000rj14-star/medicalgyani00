import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  const { message } = req.body || {};

  if (!message?.chat?.id) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/start") {
    try {
      const auth = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const response = await fetch(
        "https://api.razorpay.com/v1/payment_links",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: 3000,
            currency: "INR",
            accept_partial: false,
            description: "Medical Gyani - Medicine Guidance",
            reference_id: `TG_${chatId}_${Date.now()}`,
            notes: {
              telegram_chat_id: String(chatId)
            },
            notify: {
              sms: false,
              email: false
            },
            reminder_enable: false
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.short_url) {
        console.error("Razorpay error:", data);

        await sendTelegram(
          chatId,
          "❌ Payment link बनाने में समस्या आ गई। कृपया थोड़ी देर बाद फिर कोशिश करें।"
        );

        return res.status(200).json({ ok: true });
      }

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "💳 Pay ₹30",
              url: data.short_url
            }
          ]
        ]
      };

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              "💊 Medical Gyani\n\n" +
              "Personal Medicine Guidance की fee ₹30 है।\n\n" +
              "नीचे Pay ₹30 दबाकर payment करें।\n\n" +
              "Payment successful होने के बाद आपको इसी chat में confirmation मिलेगा।",
            reply_markup: keyboard
          })
        }
      );
    } catch (error) {
      console.error(error);

      await sendTelegram(
        chatId,
        "❌ कुछ technical problem आ गई। कृपया थोड़ी देर बाद /start भेजें।"
      );
    }
  }

  return res.status(200).json({ ok: true });
}

async function sendTelegram(chatId, text, replyMarkup = undefined) {
  const body = {
    chat_id: chatId,
    text
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  return fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
}
