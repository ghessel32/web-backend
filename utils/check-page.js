import fetch from "node-fetch";
export async function checkPageExists(url, timeoutMs = 10000) {
  try {
    // Validate URL format
    const urlPattern = /^https?:\/\/.+\..+/;
    if (!urlPattern.test(url)) {
      return {
        exists: false,
        error: "Invalid URL format",
      };
    }

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // First try HEAD request (lightweight)
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WebsiteHealthChecker/1.0)",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      // Consider 2xx and 3xx as success
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return {
          exists: true,
          status: response.status,
        };
      }

      // If HEAD fails with 405 (Method Not Allowed), try GET
      if (response.status === 405) {
        const getResponse = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WebsiteHealthChecker/1.0)",
          },
          redirect: "follow",
        });

        return {
          exists: getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400),
          status: getResponse.status,
        };
      }

      // Other non-success status codes
      return {
        exists: false,
        status: response.status,
        error: `Server returned status ${response.status}`,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError.name === "AbortError") {
        return {
          exists: false,
          error: "Request timeout - website took too long to respond",
        };
      }

      throw fetchError;
    }
  } catch (error) {
    // Handle network errors, DNS failures, etc.
    return {
      exists: false,
      error: error.message || "Unable to reach website",
    };
  }
}

export async function checkPageHandler(req, res) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const result = await checkPageExists(url);

    return res.status(200).json({
      success: true,
      exists: result.exists,
      status: result.status,
      message: result.error || (result.exists ? "Website is accessible" : "Website is not accessible"),
    });
  } catch (error) {
    console.error("Error in checkPageHandler:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while checking website",
    });
  }
}

// For Node.js projects using CommonJS
// module.exports = { checkPageExists, checkPageHandler };