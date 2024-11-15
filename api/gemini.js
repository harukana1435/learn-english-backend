const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const express = require("express");
const app = express();
app.use(express.json());

const cors = require("cors");
app.use(
  cors({
    origin: "chrome-extension://enmijodgkcjaikfdjkfceglgpahmlele", // 拡張機能のIDを指定
  })
);

app.post("/api/gemini", async (req, res) => {
  try {
    const { text } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 日本語解説を指示するプロンプトを作成
    const prompt = `
      あなたは英語の専門家で、英語を学んでいる日本人の学習者に向けて解説を行います。以下の英語の文章について、次の情報を提供してください：

      文章: "${text}"

      1. 意味: 文章全体の意味を日本語で簡潔に説明してください。
      2. 難しい単語: 文章内で難しい単語をいくつか挙げ、それぞれに対して：
          - 単語の意味を日本語で説明してください。
          - 発音（IPA表記）を教えてください。
          - その単語を使った日本語の例文も提供してください。
      3. 慣用句や特殊なフレーズ: 文章内にある慣用句や特殊なフレーズがあれば、それらの意味を説明してください。

      なるべく詳細に解説し、日本語学習者に役立つヒントを提供してください。
    `;

    const result = await model.generateContentStream(prompt);

    let result_text = "";
    for await (const chunk of result.stream) {
      //const chunkText = chunk.text();
      const chunkText = chunk.text();
      console.log(chunkText);
      result_text += chunkText;
    }
    // レスポンスの整形
    const formattedResponse = {
      result: result_text, // ストリームから取得した結果
    };

    // クライアントに結果を返す
    res.json(formattedResponse);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to call Llama2 API" });
  }
});

module.exports = app;
