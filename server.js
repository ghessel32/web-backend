import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { checkUptime } from "./utils/uptime.js";
import { getSSLCertificate } from "./utils/SSL.js";
import { getDomainInfo } from "./utils/domain.js";
import { checkHeaders } from "./utils/security.js";
import { checkUrlSafety } from "./utils/Threat.js";
import { checkBrokenLinks } from "./utils/brokenLink.js";
import { fetchSEOData } from "./utils/seo.js";
import { getSpeedPerformance } from "./utils/speed.js";
import { checkPageExists } from "./utils/check-page.js";
import { addOrUpdateWebsite } from "./utils/addWebsite.js";
import { addOrUpdateUser } from "./utils/addUser.js";
import { getLeaderboard, getTopWebsites } from "./utils/leaderboard.js";
dotenv.config({ path: "./.env" });

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Common async wrapper to handle errors
const asyncHandler = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Routes
app.post(
  "/api/check-page",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return checkPageExists(url);
  })
);

app.post(
  "/api/add-website",
  asyncHandler(async (req) => {
    const { name, url, score } = req.body;
    return addOrUpdateWebsite(name, url, score);
  })
);

app.post(
  "/api/add-user",
  asyncHandler(async (req) => {
    const { email, name } = req.body;
    return addOrUpdateUser(name, email);
  })
);

app.post(
  "/api/check-uptime",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return checkUptime(url);
  })
);

app.post(
  "/api/domain",
  asyncHandler(async (req) => {
    const { domain } = req.body;
    return getDomainInfo(domain);
  })
);

app.post(
  "/api/ssl",
  asyncHandler(async (req) => {
    const { url } = req.body;
    const hostname = new URL(url).hostname;
    return getSSLCertificate(hostname);
  })
);

app.post(
  "/api/security",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return checkHeaders(url);
  })
);

app.post(
  "/api/threat",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return checkUrlSafety(url);
  })
);

app.post(
  "/api/seo",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return fetchSEOData(url);
  })
);

app.post(
  "/api/speed",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return getSpeedPerformance(url);
  })
);

app.post(
  "/api/broken-links",
  asyncHandler(async (req) => {
    const { url } = req.body;
    return checkBrokenLinks(url);
  })
);

app.get("/api/leaderboard", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await getLeaderboard(Number(page), Number(limit));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/top-websites", async (req, res) => {
  try {
    const data = await getTopWebsites();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Default server port
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
