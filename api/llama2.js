const express = require("express");
const Replicate = require("replicate");
const app = express();
app.use(express.json());

// Replicateのインスタンスを作成
const replicate = new Replicate();

app.post("/api/llama2", async (req, res) => {
  try {
    const { text } = req.body;

    // 日本語解説を指示するプロンプトを作成
    const prompt = `
      あなたは英語の専門家で、英語を学んでいる日本人の学習者に向けて解説を行います。以下の英語の文章について、次の情報を提供してください：

      Text: "${text}"

      1. **意味**: 文章全体の意味を日本語で簡潔に説明してください。
      2. **難しい単語**: 文章内で難しい単語をいくつか挙げ、それぞれに対して：
          - 単語の意味を日本語で説明してください。
          - 発音（IPA表記）を教えてください。
          - その単語を使った日本語の例文も提供してください。
      3. **慣用句や特殊なフレーズ**: 文章内にある慣用句や特殊なフレーズがあれば、それらの意味と日本語での使い方を説明してください。
      4. **文法の解説**: 文章内の文法構造について、日本語で詳細に解説してください。特に、時制や文の種類、語順、使われている重要な文法項目について説明してください。
      5. **改善提案**: 文章をより分かりやすくするための提案があれば、日本語で説明してください。

      なるべく詳細に解説し、日本語学習者に役立つヒントを提供してください。
    `;

    // Replicate APIへのリクエスト
    const input = {
      top_p: 1,
      prompt: prompt, // 更新したプロンプトを使用
      temperature: 0.5,
      max_new_tokens: 500,
      min_new_tokens: -1,
    };

    // Llama2 APIをストリームで呼び出す
    let result = "";
    for await (const event of replicate.stream("meta/llama-2-70b-chat", {
      input,
    })) {
      result += event; // ストリームデータを結果に追加
    }

    // レスポンスの整形
    const formattedResponse = {
      result: result, // ストリームから取得した結果
    };

    // クライアントに結果を返す
    res.json(formattedResponse);
  } catch (error) {
    console.error("Error calling Llama2 API:", error);
    res.status(500).json({ error: "Failed to call Llama2 API" });
  }
});

module.exports = app;
