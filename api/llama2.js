const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/api/llama2", async (req, res) => {
  try {
    const { text } = req.body;

    // Llama2 APIへのリクエスト
    const response = await axios.post(
      "https://llama2-api-endpoint-url",
      {
        // 送信データの設定
        prompt: text,
        // 必要に応じてパラメータを設定
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LLAMA2_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // レスポンスの整形
    const formattedResponse = {
      result: response.data.result,
      details: response.data.additionalInfo, // 必要に応じて整形
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error("Error calling Llama2 API:", error);
    res.status(500).json({ error: "Failed to call Llama2 API" });
  }
});

module.exports = app;
