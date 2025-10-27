import express from "express";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Puppeteer reuse
let browser;
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

// Scrape function
async function scrapeInstagram(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

  const meta = await page.evaluate(() => {
    const tags = {};
    document.querySelectorAll("meta[property^='og:']").forEach((el) => {
      tags[el.getAttribute("property")] = el.getAttribute("content");
    });
    return tags;
  });

  await page.close();

  return {
    image: meta["og:image"] || null,
    video: meta["og:video"] || null,
    caption: meta["og:description"] || null,
  };
}

// API routes
app.get("/info", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });
  try {
    const data = await scrapeInstagram(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scrape media" });
  }
});

app.get("/download", async (req, res) => {
  const { url, type = "image" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url=" });

  try {
    const data = await scrapeInstagram(url);
    const mediaUrl = type === "video" ? data.video : data.image;

    if (!mediaUrl)
      return res.status(404).json({ error: "No media found for this post" });

    const mediaResponse = await fetch(mediaUrl);
    res.set("Content-Type", mediaResponse.headers.get("content-type"));
    res.set(
      "Content-Disposition",
      `attachment; filename="instagram_${type}.${type === "video" ? "mp4" : "jpg"}"`
    );
    mediaResponse.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Download failed" });
  }
});

// ✅ Catch-all (Express 5 compatible)
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
