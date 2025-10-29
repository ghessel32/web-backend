import * as cheerio from "cheerio";
import fetch from "node-fetch";
import puppeteer from "puppeteer";

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
  }

  return browser;
}

export async function fetchSEOData(url) {
  try {
    // Step 1: Lightweight Fetch
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 8000,
    });

    const html = await res.text();

    if (
      !res.ok ||
      html.length < 200 ||
      /cloudflare|access denied|checking your browser/i.test(html)
    ) {
      throw new Error("Blocked or incomplete content");
    }

    return parseSEO(html, url);
  } catch (fetchErr) {
    console.warn(
      `[SEO] Fetch failed for ${url}: ${fetchErr.message}. Using Puppeteer fallback...`
    );

    try {
      // Step 2: Puppeteer Fallback (Browser Simulation)
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      const html = await page.content();
      await page.close();

      return parseSEO(html, url);
    } catch (puppeteerErr) {
      console.error(
        `[SEO] Puppeteer failed for ${url}: ${puppeteerErr.message}`
      );
      return {
        blocked: true,
        message: "SEO data could not be fetched — site uses strong protection.",
      };
    }
  }
}

// Parse HTML and extract SEO fields
function parseSEO(html, url) {
  const $ = cheerio.load(html);
  const title = $("title").text() || null;
  const metaDescription = $('meta[name="description"]').attr("content") || null;
  const h1 = $("h1").first().text() || null;
  const robots = $("meta[name='robots']").attr("content") || null;
  const canonical = $("link[rel='canonical']").attr("href") || null;
  const sitemap =
    $("link[rel='sitemap']").attr("href") ||
    `${url.replace(/\/$/, "")}/sitemap.xml`;

  const ogTags = {};
  $('meta[property^="og:"]').each((_, el) => {
    const p = $(el).attr("property"),
      c = $(el).attr("content");
    if (p && c) ogTags[p.replace("og:", "")] = c;
  });

  const twitterTags = {};
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_, el) => {
    const key = ($(el).attr("name") || $(el).attr("property")).replace(
      "twitter:",
      ""
    );
    const val = $(el).attr("content");
    if (key && val) twitterTags[key] = val;
  });

  return {
    blocked: false,
    title,
    metaDescription,
    h1,
    robots,
    canonical,
    sitemap,
    openGraph: { present: !!Object.keys(ogTags).length, tags: ogTags },
    twitter: { present: !!Object.keys(twitterTags).length, tags: twitterTags },
  };
}
