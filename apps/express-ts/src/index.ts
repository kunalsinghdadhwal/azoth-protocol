import express, { Request, Response } from "express";

import bodyParser from "body-parser";
import { NilaiOpenAIClient, NilAuthInstance } from "@nillion/nilai-ts";

// Create a new express application instance
const app = express();
app.use(bodyParser.json());

// Set the network port
const port = process.env.PORT || 3000;
const client = new NilaiOpenAIClient({
  baseURL: "https://nilai-a779.nillion.network/v1/",
  apiKey: process.env.NILLION_API_KEY!,
  nilauthInstance: NilAuthInstance.SANDBOX,
});

// Define the root path with a greeting message
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Express + TypeScript Server!" });
});
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received message:", message);
    const response = await client.chat.completions.create({
      model: "google/gemma-3-27b-it",
      messages: [{ role: "user", content: message }],
    });
    console.log("Nilai API response:", response);
    res.json({ response: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Nilai API failed" });
  }
}); 

// Start the Express server
app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}`);
});
