import * as cheerio from "cheerio";
import fetch from "node-fetch";

export async function fetchSEOData(url) {
  try {
    // Fetch the page with realistic headers
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch URL (status: ${res.status})`);

    const html = await res.text();

    // Detect bot protection / blocked pages
    const botBlocked =
      html.includes("Cloudflare") ||
      html.includes("Access denied") ||
      html.includes("Checking your browser") ||
      html.length < 100;

    if (botBlocked) {
      return {
        blocked: true,
        message:
          "SEO data could not be fetched — this site uses a protection layer that blocks automated requests.",
      };
    }

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Extract basic SEO fields
    const title = $("title").text() || null;
    const metaDescription = $('meta[name="description"]').attr("content") || null;
    const h1 = $("h1").first().text() || null;
    const robots = $("meta[name='robots']").attr("content") || null;
    const sitemap =
      $("link[rel='sitemap']").attr("href") || `${url.replace(/\/$/, "")}/sitemap.xml`;
    const canonical = $("link[rel='canonical']").attr("href") || null;

    // Extract Open Graph tags
    const ogTags = {};
    $('meta[property^="og:"]').each((i, elem) => {
      const property = $(elem).attr("property");
      const content = $(elem).attr("content");
      if (property && content) {
        // Remove 'og:' prefix for cleaner keys
        const key = property.replace("og:", "");
        ogTags[key] = content;
      }
    });

    // Extract Twitter Card tags (check both name and property attributes)
    const twitterTags = {};
    
    // Check meta tags with name="twitter:*"
    $('meta[name^="twitter:"]').each((i, elem) => {
      const name = $(elem).attr("name");
      const content = $(elem).attr("content");
      if (name && content) {
        const key = name.replace("twitter:", "");
        twitterTags[key] = content;
      }
    });
    
    // Also check meta tags with property="twitter:*" (some sites use this)
    $('meta[property^="twitter:"]').each((i, elem) => {
      const property = $(elem).attr("property");
      const content = $(elem).attr("content");
      if (property && content) {
        const key = property.replace("twitter:", "");
        // Don't overwrite if already found via name attribute
        if (!twitterTags[key]) {
          twitterTags[key] = content;
        }
      }
    });

    // Return all fields
    return {
      blocked: false,
      title,
      metaDescription,
      h1,
      robots,
      sitemap,
      canonical,
      mobileFriendly: true, // default assumption; can extend later
      openGraph: {
        present: Object.keys(ogTags).length > 0,
        tags: ogTags,
      },
      twitter: {
        present: Object.keys(twitterTags).length > 0,
        tags: twitterTags,
      },
    };
  } catch (error) {
    console.error(`SEO fetch error for ${url}:`, error.message);
    return {
      blocked: true,
      message: "SEO data could not be fetched due to a network or server error.",
    };
  }
}