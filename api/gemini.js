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

1. 和訳: 文章全体を自然な日本語で、意味を損なわない範囲で直訳してください。|
2. 難しい単語: 文章内で難しい単語や専門的な単語をいくつか挙げ、それぞれに対して以下の情報を提供してください。複数の単語を提示し、各単語について詳細を述べてください。
   - 原文中での単語の意味を日本語で説明してください。その単語に別の意味があれば、その意味もまとめて教えてください。
   - 発音（IPA表記）を教えてください。
   - その単語を使った英語の例文とその和訳を提供してください。
   - 同義語、反義語、よく一緒に使われる単語を挙げてください。|
3. 熟語: 文章内に熟語があれば、それらをいくつか挙げ、それぞれについて以下の情報を提供してください。熟語は、2つ以上の単語が固定された順序で使われ、全体として一つの意味を表します。
   - 熟語の意味と使われ方を説明してください。
   - 似た表現や、より簡単な言い方を紹介してください。|
   
形式は次のように出力してください。各項目の最後に '|' を付けてください。単語や慣用句の内側の項目は必ず '-' で区切ってください。これらは後に処理するためのルールです。

1. 和訳: 例文の和訳を記載します。|
2. 難しい単語 |
単語: example1 -
意味: 原文中での意味[名詞]、別の意味[動詞] -
発音: /example/ -
例文: This is an example sentence. （これは例文です。） -
同義語: synonym1, synonym2 -
反義語: antonym1, antonym2 -
よく一緒に使われる単語: common phrase1, common phrase2 |
単語: example2 -
意味: 原文中での意味[形容詞]、別の意味[副詞] -
発音: /example/ -
例文: Another example sentence. （別の例文です。） -
同義語: synonym3, synonym4 -
反義語: antonym3, antonym4 -
よく一緒に使われる単語: common phrase3, common phrase4 |
3. 熟語 |
熟語: phrase1 -
意味: 熟語の意味を説明します。 -
解説: 熟語の使われ方について解説します。 -
類似表現: similar phrase1, simpler phrase1 |
熟語: phrase2 -
意味: 別の熟語の意味を説明します。 -
解説: 別の熟語の使われ方について解説します。 -
類似表現: similar phrase2, simpler phrase2 |


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
