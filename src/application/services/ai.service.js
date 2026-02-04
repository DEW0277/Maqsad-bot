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
      Foydalanuvchi quyidagi modulni tugatdi: "${moduleTitle}".
      Foydalanuvchi fikri: "${feedbackText}".
      
      Iltimos, ushbu fikrni tahlil qiling va quyidagilarni aniqlang:
      1. Fikr ijobiymi yoki salbiymi?
      2. Foydalanuvchi nimalarni o'rganganini aytib o'tdimi?
      3. Qisqacha javob yozing (o'zbek tilida).
      
      Javobni quyidagi formatda json qilib bering:
      {
        "sentiment": "positive" | "negative" | "neutral",
        "analysis": "qisqacha tahlil",
        "reply": "foydalanuvchiga javob"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "Sen o'qituvchi yordamchisisan." }, { role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
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
