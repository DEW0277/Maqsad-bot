const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

exports.analyzeFeedback = async (moduleTitle, feedbackText) => {
  try {
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
    console.error("OpenAI Error:", error);
    // Fallback if AI fails
    return {
      sentiment: "neutral",
      analysis: "AI tahlil qila olmadi.",
      reply: "Fikringiz uchun rahmat! Tez orada admin ko'rib chiqadi."
    };
  }
};
