export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Bot is running");
  }

  try {
    const message = req.body?.message;

    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || "";

    if (text === "/start" || text === "/payment") {
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
              "💊 Medical Gyani\n\n" +
              "Personal Medicine Guidance ki fee ₹30 hai.\n\n" +
              "Neeche diye gaye button se ₹30 payment karein.\n\n" +
              "Payment complete hone ke baad payment ka screenshot ya Transaction ID isi chat me bhej dein.\n\n" +
              "Payment manually verify hone ke baad aap apni medicine/problem ki details bhej sakte hain.",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "💳 Pay ₹30",
                    url: "https://rzp.io/rzp/Y0tRQN2"
                  }
                ]
              ]
            }
          })
        }
      );
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("Telegram error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
