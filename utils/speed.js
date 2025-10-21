import fetch from "node-fetch";


export const getSpeedPerformance = async (url) => {
  try {
    const apiKey = process.env.SPEED_API;

    // Fetch Desktop & Mobile in parallel
    const [desktopRes, mobileRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=DESKTOP&key=${apiKey}`
      ),
      fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&strategy=MOBILE&key=${apiKey}`
      ),
    ]);

    const [desktopData, mobileData] = await Promise.all([
      desktopRes.json(),
      mobileRes.json(),
    ]);

    // -------------------------
    // Helper: convert Lighthouse score (0–1) to category
    const scoreToCategory = (score) => {
      if (score === null || score === undefined) return "N/A";
      if (score >= 0.9) return "fast";
      if (score >= 0.5) return "moderate";
      return "slow";
    };

    // -------------------------
    // Extract lab metrics per device
    const extractLabData = (data) => {
      const audits = data?.lighthouseResult?.audits || {};
      const metrics = {
        "First Contentful Paint": scoreToCategory(
          audits["first-contentful-paint"]?.score
        ),
        "Largest Contentful Paint": scoreToCategory(
          audits["largest-contentful-paint"]?.score
        ),
        "Total Blocking Time": scoreToCategory(
          audits["total-blocking-time"]?.score
        ),
        "Cumulative Layout Shift": scoreToCategory(
          audits["cumulative-layout-shift"]?.score
        ),
      };
      return metrics;
    };

    // -------------------------
    const extractIssues = (audits) => {
      if (!audits) return null;
      const issues = [];

      const pushIssue = (type, severity, description, impact, items = []) => {
        issues.push({ type, severity, description, impact, items });
      };

      // Helper to check if audit failed
      const auditFailed = (auditKey) => {
        const audit = audits[auditKey];
        return audit && audit.score !== null && audit.score < 1;
      };

      // 1. RENDER-BLOCKING REQUESTS (Uses "-insight" suffix)
      if (auditFailed("render-blocking-insight")) {
        const rbr = audits["render-blocking-insight"];
        pushIssue(
          "Render-Blocking Requests",
          "High",
          rbr.description || "Resources blocking initial render",
          rbr.displayValue || "Delays page load",
          rbr.details?.items?.map((i) => ({
            url: i.url,
            wastedMs: i.wastedMs,
          })) || []
        );
      }

      // 2. IMAGE OPTIMIZATION (Uses "image-delivery-insight")
      if (auditFailed("image-delivery-insight")) {
        const imgOpt = audits["image-delivery-insight"];
        const items = imgOpt.details?.items || [];

        if (items.length > 0) {
          pushIssue(
            "Image Optimization",
            "High",
            imgOpt.description || "Images can be optimized",
            imgOpt.displayValue || "Faster load time",
            items.slice(0, 10).map((i) => ({
              url: i.url,
              savingsKB: Math.round((i.wastedBytes || 0) / 1024),
              savingsMs: i.wastedMs || 0,
            }))
          );
        }
      }

  
      // 3. THIRD-PARTY CODE (Uses "-insight" suffix)
      if (auditFailed("third-parties-insight")) {
        const thirdParty = audits["third-parties-insight"];
        const items = thirdParty.details?.items || [];

        if (items.length > 0) {
          const totalMs = items.reduce(
            (sum, i) => sum + (i.blockingTime || 0),
            0
          );
          pushIssue(
            "Third-Party Code",
            "Medium",
            thirdParty.description || "3rd party scripts detected",
            totalMs > 0
              ? `~${Math.round(totalMs)}ms blocking time`
              : "May impact performance",
            items.slice(0, 5).map((i) => ({
              entity: i.entity?.text || i.entity || "Unknown",
              blockingTime: i.blockingTime || 0,
              transferKB: Math.round((i.transferSize || 0) / 1024),
            }))
          );
        }
      }

      // 4. FONT LOADING (Uses "-insight" suffix)
      if (auditFailed("font-display-insight")) {
        const fontDisplay = audits["font-display-insight"];
        pushIssue(
          "Font Loading Strategy",
          "Low",
          fontDisplay.description || "Fonts blocking text rendering",
          "Use font-display: swap",
          fontDisplay.details?.items?.map((i) => ({ url: i.url })) || []
        );
      }

      
      return issues.length ? issues : null;
    };

    // -------------------------
    const labData = {
      desktop: extractLabData(desktopData),
      mobile: extractLabData(mobileData),
    };

    const issuesData = {
      desktop: extractIssues(desktopData?.lighthouseResult?.audits),
      mobile: extractIssues(mobileData?.lighthouseResult?.audits),
    };



    return { success: true, labData, issuesData };
  } catch (err) {
    console.error("Speed API error:", err);
    return { success: false, message: "Failed to fetch performance data" };
  }
};
