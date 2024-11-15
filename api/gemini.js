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

      次のような形式で出力してください。各項目の最後に'|'を付け足して。単語や慣用句の項目は'-'で区切って。太字つまり*text*を使わないでください:
      1. 和訳: この研究は、複数のデータセットのラベル空間の和から予測する単一の視覚関係検出器のトレーニングに焦点を当てています。|
      2. 難しい単語 |
      * training -
      意味: トレーニング（名詞）、訓練（名詞）、教育（名詞）-
      発音: /ˈtreɪnɪŋ/ -
      例文: The AI system requires extensive training to perform well. （AIシステムは、適切に動作するために広範なトレーニングが必要です。） |
      * detector -
      意味: 検出器（名詞） -
      発音: /dɪˈtɛktər/ -
      例文: The smoke detector went off when it detected the fire. （火災を検出したとき、煙探知器が鳴った。） |
      * predicting -
      意味: 予測する（動詞）、予知する（動詞） -
      発音: /prɪˈdɪktɪŋ/ -
      例文: The weather forecast predicts rain for tomorrow. （天気予報では明日の降雨を予測しています。） |
      3. 慣用句や特殊なフレーズ |
      * over the union of label spaces from multiple datasets -
      意味: 和に基づいて -
      解説: 複数のデータセットのラベル空間の和全体にわたって予測を行うことを意味します。 |

      

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
