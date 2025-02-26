require("dotenv").config();
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getTranscript(youtubeUrl) {
  // Launch puppeteer, and let it automatically install Chromium
  const browser = await puppeteer.launch({
    headless: true, // Run headless
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add flags for production environments like Render
  });

  const page = await browser.newPage();
  await page.goto("https://notegpt.io/youtube-transcript-generator", { waitUntil: "domcontentloaded" });
  console.log("went to");

  // Enter YouTube URL
  await page.type(".ng-script-input input", youtubeUrl);
  console.log("Entered");

  // Click "Generate Transcript" button
  await page.click(".ng-script-btn");
  console.log("Clicked");

  // Wait for transcript to load
  await page.waitForSelector('.ng-transcript-item-text .text-container', { timeout: 15000 });

  // Extract transcript from the page directly
  const transcript = await page.evaluate(() => {
    const items = document.querySelectorAll('.ng-transcript-item-text .text-container');
    let transcriptText = '';
    items.forEach(item => {
      transcriptText += item.innerText + '\n';  // Collect all text from transcript items
    });
    return transcriptText;
  });

  await browser.close();
  console.log("Transcript extracted");
  return transcript;
}

app.post("/api/v1/summarize", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    const transcript = await getTranscript(url);
    if (!transcript) {
      return res.status(404).json({ error: "Transcript not found." });
    }

    // Use Gemini AI for summarization
    const result = await model.generateContent(`Summarize this YouTube video transcript in detail:\n\n${transcript}`);
    const summary = result.response.text() || "Summary not available.";

    res.json({ summary });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to process request" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
