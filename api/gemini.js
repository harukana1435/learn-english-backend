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

      1. 和訳: 文章全体の意味を日本語で簡潔に説明してください。
      2. 難しい単語: 文章内で難しい単語をいくつか挙げ、それぞれに対して：
          - 単語の意味を日本語で説明してください。複数の品詞があれば、その意味もまとめて教えてください
          - 発音（IPA表記）を教えてください。
          - その単語を使った英語の例文とその和訳も提供してください。
      3. 慣用句や特殊なフレーズ: 文章内にある慣用句や特殊なフレーズがあれば、それらの意味を説明してください。

      例:
      "She was walking down the street when she suddenly saw a man standing in the middle of the road, looking lost."

      1. 和訳:
      彼女は通りを歩いていたとき、突然、道の真ん中に立っている男を見かけた。彼は迷子のように見えた。

      2. 難しい単語:
        **walking**
        意味: 歩く（動詞）。移動するために足を使う動作（名詞）。
        発音: /ˈwɔːkɪŋ/
        例文: She was walking to the park when it started raining.
        （彼女は公園に向かって歩いていたとき、雨が降り始めた。）
        
        **suddenly++
        意味: 突然に（副詞）。予期せずに、急に。
        発音: /ˈsʌdnli/
        例文: Suddenly, the lights went out.
        （突然、電気が消えた。）

      3. 慣用句や特殊なフレーズ:
        **in the middle of the road**
        意味: 道の真ん中で。何かが完全に中央または主要な位置にあることを示す表現。
        解説: このフレーズは物理的な位置を指しているだけでなく、道の真ん中にいるという状況が、何かが予期せずに立ち止まっている、あるいは不安定な状況であることを強調しています。特に「道の真ん中に立っている」というのは、注意を引くため、または物理的に迷っているように感じる状況を示唆します。

      

      なるべく詳細に解説し、日本語学習者に役立つヒントを提供してください。
    `;

    const result = await model.generateContentStream(prompt);

    let result_text = "";
    let timeoutFlag = false;

    const timeout = setTimeout(() => {
      timeoutFlag = true;
      res.status(504).json({ error: "Request Timeout" });
    }, 60000); // タイムアウトを60秒に設定

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

    clearTimeout(timeout); // タイムアウトを解除

    if (!timeoutFlag) {
      res.json({ result: result_text });
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to call Gemini API" });
  }
});

module.exports = app;
