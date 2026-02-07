const OpenAI = require('openai');



exports.analyzeFeedback = async (moduleTitle, feedbackText) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API Key is missing. Skipping AI analysis.");
      throw new Error("Missing OpenAI API Key");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, 
    });

    const prompt = `
      Siz "Maqsad" loyihasining aqlli yordamchisisiz. Sizning vazifangiz o'quvchilarning modullar bo'yicha qoldirgan fikrlarini (feedback) tahlil qilishdir.

      Foydalanuvchi ma'lumotlari:
      - Modul: "${moduleTitle}"
      - Fikr: "${feedbackText}"
      
      Tahlil qiling va quyidagi JSON formatida javob qaytaring:
      {
        "sentiment": "positive" | "negative" | "neutral",
        "analysis": "Fikrning qisqacha va aniq tahlili (o'zbek tilida). Foydalanuvchi nimalarni o'rgangani yoki nimalardan noroziligi haqida.",
        "reply": "Foydalanuvchiga yuboriladigan rag'batlantiruvchi va samimiy javob (o'zbek tilida). Agar fikr salbiy bo'lsa, muammoni hal qilishga tayyor ekanligingizni bildiring."
      }

      Muhim: 
      - Javob faqat va faqat JSON formatida bo'lishi shart.
      - Ijobiy fikrlar uchun motivatsiya bering.
      - Salbiy fikrlar uchun konstruktiv yondashing.
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Siz ta'lim platformasining professional o'zbek tili mutaxassisi va tahlilchisisiz. Javoblaringiz aniq, ravon va grammatik jihatdan to'g'ri bo'lishi kerak." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Service Error:", error.message);
    // Fallback if AI fails or key is missing
    return {
      sentiment: "neutral",
      analysis: "AI tahlil qila olmadi (Tizim xatosi yoki kalit yo'q).",
      reply: "Fikringiz uchun rahmat! Tez orada admin ko'rib chiqadi."
    };
  }
};
