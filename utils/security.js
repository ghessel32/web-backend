import fetch from "node-fetch";

export async function checkHeaders(url) {
  const results = {
    httpsEnabled: false,
    hstsHeader: false,
    contentSecurityPolicy: false,
    xFrameOptions: false,
  };

  try {
    results.httpsEnabled = url.startsWith("https://");

    const res = await fetch(url, { method: "HEAD", redirect: "manual" });
    const headers = res.headers;

    results.hstsHeader = !!headers.get("strict-transport-security");
    results.contentSecurityPolicy = !!headers.get("content-security-policy");
    results.xFrameOptions = !!headers.get("x-frame-options");

    return results;
  } catch (err) {
    return { error: err.message };
  }
}
