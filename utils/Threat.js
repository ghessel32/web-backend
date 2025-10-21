
import axios from "axios";

const API_KEY = process.env.THREAT_API;
const API_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

export async function checkUrlSafety(urlToCheck) {
  const body = {
    client: {
      clientId: "webvytal",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: urlToCheck }],
    },
  };

  try {
    const response = await axios.post(API_URL, body, {
      headers: { "Content-Type": "application/json" },
    });

    let malware = false;
    let phishing = false;
    let unwanted = false;

    if (response.data && response.data.matches) {
      response.data.matches.forEach((match) => {
        if (match.threatType === "MALWARE") malware = true;
        if (match.threatType === "SOCIAL_ENGINEERING") phishing = true;
        if (match.threatType === "UNWANTED_SOFTWARE") unwanted = true;
      });
    }

    return {
      malware,
      phishing,
      unwanted,
      safe: !(malware || phishing || unwanted),
    };
  } catch (err) {
    return { error: err.response?.data || err.message };
  }
}
