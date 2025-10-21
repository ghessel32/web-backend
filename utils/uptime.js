export const checkUptime = async (url) => {
  const start = performance.now(); // ⏱ start timing
  try {
    const response = await fetch(url, { method: "HEAD" });
    const end = performance.now();

    return {
      ok: response.ok,
      status: response.status,
      responseTime: Math.round(end - start), // in ms
    };
  } catch (error) {
    console.error("Error checking uptime:", error);
    const end = performance.now();
    return {
      ok: false,
      status: "error",
      responseTime: Math.round(end - start),
    };
  }
};
