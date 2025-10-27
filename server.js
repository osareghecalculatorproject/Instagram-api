import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// --- Instagram oEmbed Scraper ---
app.get("/api/scrape", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const cleanUrl = url.split("?")[0];
    const apiUrl = `https://www.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}&omitscript=true`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Instagram oEmbed error:", response.status, text);
      return res.status(404).json({
        error: `Instagram returned status ${response.status}. Make sure the post is public.`,
      });
    }

    const data = await response.json();

    res.json({
      mediaType: data.thumbnail_url?.endsWith(".mp4") ? "video" : "image",
      thumbnail: data.thumbnail_url,
      caption: data.title || "",
      author: data.author_name || "",
      originalUrl: cleanUrl,
    });
  } catch (err) {
    console.error("Error fetching from Instagram oEmbed:", err);
    res.status(500).json({ error: "Unable to fetch data from Instagram" });
  }
});

// --- Instagram oEmbed Endpoint ---
app.get("/api/scrape", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Clean up URL (remove tracking params)
    const cleanUrl = url.split("?")[0];

    // Instagram oEmbed API (publicly available)
    const apiUrl = `https://www.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}&omitscript=true`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(404).json({ error: "Failed to fetch data from Instagram" });
    }

    const data = await response.json();

    // Return useful info
    res.json({
      mediaType: data.thumbnail_url?.endsWith(".mp4") ? "video" : "image",
      thumbnail: data.thumbnail_url,
      caption: data.title || "",
      author: data.author_name || "",
      originalUrl: cleanUrl,
    });
  } catch (err) {
    console.error("Error fetching from Instagram oEmbed:", err);
    res.status(500).json({ error: "Unable to fetch data" });
  }
});

// --- Serve Frontend ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
