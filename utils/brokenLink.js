import { LinkChecker } from "linkinator";

export async function checkBrokenLinks(url) {
  const checker = new LinkChecker();

  const result = await checker.check({
    path: [url],
    recurse: false,
    concurrency: 10,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // Filter out only the broken URLs
  const brokenUrls = result.links
    .filter((link) => link.state === "BROKEN")
    .map((link) => link.url);

  return { count: brokenUrls.length, links: brokenUrls };
}
