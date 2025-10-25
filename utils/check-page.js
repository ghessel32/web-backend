import fetch from "node-fetch";
import dns from "dns/promises";

export async function checkPageExists(url, timeoutMs = 5000) {
  try {
    const urlPattern = /^https?:\/\/.+\..+/;
    if (!urlPattern.test(url)) {
      return { exists: false, error: "Invalid URL format" };
    }

    const hostname = new URL(url).hostname;

    // 1️⃣ Fast DNS check (quickly rejects non-existent domains)
    try {
      await dns.lookup(hostname);
    } catch {
      return { exists: false, error: "DNS lookup failed (invalid or unreachable host)" };
    }

    // 2️⃣ Setup timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // 3️⃣ Perform single lightweight GET
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "manual", // no need to follow multiple redirects
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebsiteHealthChecker/1.0)",
      },
    });

    clearTimeout(timeoutId);

    // 4️⃣ Evaluate response
    return {
      exists: response.ok || (response.status >= 300 && response.status < 400),
      status: response.status,
    };
  } catch (err) {
    return {
      exists: false,
      error:
        err.name === "AbortError"
          ? "Request timeout (took too long)"
          : err.message || "Error checking page",
    };
  }
}
