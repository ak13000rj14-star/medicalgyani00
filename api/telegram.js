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

  // /start
  if (text === "/start") {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "💳 Pay ₹30",
            url: "https://rzp.io/rzp/Y0tRQN2"
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
            "Payment के बाद payment screenshot/Transaction ID इसी chat में भेज दें।",
          reply_markup: keyboard
        })
      }
    );
  }

  // Payment screenshot/photo
  if (message.photo) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "✅ Payment screenshot मिल गया है।\n\n" +
            "आपका screenshot verification के लिए भेज दिया गया है।\n" +
            "कृपया थोड़ी देर प्रतीक्षा करें।"
        })
      }
    );
  }

  return res.status(200).json({ ok: true });
}
