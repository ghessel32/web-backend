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
import { checkPageHandler } from "./utils/check-page.js";
import { addOrUpdateWebsite } from "./utils/addWebsite.js";
import { addOrUpdateUser } from "./utils/addUser.js";

dotenv.config({
  path: "./.env",
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/check-page", checkPageHandler);

app.post("/api/add-website", async (req, res) => {
  const { name, url } = req.body;
  const result = await addOrUpdateWebsite(name, url);
  res.json(result);
});

app.post("/api/add-user", async (req, res) => {
  const { email, name } = req.body;
  console.log(email, name);

  const result = await addOrUpdateUser(name, email);
  res.json(result);
});

app.post("/api/check-uptime", async (req, res) => {
  const { url } = req.body;
  const result = await checkUptime(url);
  res.json(result);
});

app.post("/api/domain", async (req, res) => {
  const { domain } = req.body;
  const result = await getDomainInfo(domain);
  res.json(result);
});

app.post("/api/ssl", async (req, res) => {
  const { url } = req.body;
  try {
    const hostname = new URL(url).hostname;
    const result = await getSSLCertificate(hostname);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/security", async (req, res) => {
  const { url } = req.body;
  const result = await checkHeaders(url);
  res.json(result);
});

app.post("/api/threat", async (req, res) => {
  const { url } = req.body;
  const result = await checkUrlSafety(url);
  res.json(result);
});

app.post("/api/seo", async (req, res) => {
  const { url } = req.body;
  const result = await fetchSEOData(url);
  res.json(result);
});

app.post("/api/speed", async (req, res) => {
  const { url } = req.body;
  const result = await getSpeedPerformance(url);
  res.json(result);
});

app.post("/api/broken-links", async (req, res) => {
  const { url } = req.body;
  const result = await checkBrokenLinks(url);
  res.json(result);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
