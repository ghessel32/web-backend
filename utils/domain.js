import { whoisDomain } from "whoiser";
import fetch from "node-fetch";

// === Utility Helpers ===
function extractRootDomain(input) {
  if (!input) return "";
  let domain = input.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const parts = domain.split(".");
  if (parts.length > 2) return parts.slice(-2).join(".");
  return domain;
}

function getDaysLeft(expiryDate) {
  if (!expiryDate) return 0;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry)) return 0;
  const diff = expiry - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d)) return "N/A";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseProtectionStatus(status) {
  if (!status) return { serverProtected: false };
  const str = Array.isArray(status)
    ? status.join(" ").toLowerCase()
    : status.toLowerCase();

  const protectedStatus =
    str.includes("prohibited") ||
    str.includes("clientupdateprohibited") ||
    str.includes("serverupdateprohibited") ||
    str.includes("servertransferprohibited");

  return { serverProtected: protectedStatus };
}

// === RDAP Fallback ===
async function getRdapInfo(domain) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const expiryEvent = data.events?.find((e) => e.eventAction === "expiration");
    return {
      expiryDate: expiryEvent?.eventDate || null,
      domainStatus: data.status || [],
    };
  } catch (err) {
    console.warn(`RDAP lookup failed for ${domain}:`, err.message);
    return {};
  }
}

// === WHOISXML API (Final Fallback) ===
async function getWhoisXmlApi(domain) {
  const apiKey = process.env.WHOISXML_KEY; // store securely
  if (!apiKey) return {};

  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const record = data?.WhoisRecord || {};
    const registry = record.registryData || {};

    const expiryDate =
      record.expiresDateNormalized ||
      registry.expiresDate ||
      registry.expiresDateNormalized ||
      record.expiresDate ||
      null;

    const status =
      record.status ||
      registry.status ||
      [];

    return { expiryDate, domainStatus: status };
  } catch (err) {
    console.warn(`WhoisXMLAPI failed for ${domain}:`, err.message);
    return {};
  }
}

// === Main Entry ===
export async function getDomainInfo(domain) {
  try {
    const root = extractRootDomain(domain);
    if (!root) throw new Error("Invalid domain");

    let expiryDate = null;
    let domainStatus = null;

    // 1️⃣ Try WHOIS
    try {
      const data = await whoisDomain(root, { follow: 2, timeout: 8000 });
      const whoisData =
        data["whois.verisign-grs.com"] ||
        Object.values(data).find((o) => o && Object.keys(o).length > 3) ||
        {};

      expiryDate =
        whoisData["Registry Expiry Date"] ||
        whoisData["Registrar Registration Expiration Date"] ||
        whoisData["Expiry Date"] ||
        whoisData["Expiration Date"] ||
        whoisData.expiryDate ||
        whoisData.expires ||
        whoisData["paid-till"];

      domainStatus =
        whoisData["Domain Status"] ||
        whoisData.domainStatus ||
        whoisData.status ||
        whoisData.Status;
    } catch (err) {
      console.warn(`WHOIS failed for ${root}:`, err.message);
    }

    // 2️⃣ Fallback: RDAP
    if (!expiryDate) {
      const rdap = await getRdapInfo(root);
      expiryDate = rdap.expiryDate || expiryDate;
      domainStatus = rdap.domainStatus || domainStatus;
    }

    // 3️⃣ Fallback: WHOISXML API
    if (!expiryDate) {
      const api = await getWhoisXmlApi(root);
      expiryDate = api.expiryDate || expiryDate;
      domainStatus = api.domainStatus || domainStatus;
    }

    const daysLeft = getDaysLeft(expiryDate);
    const protection = parseProtectionStatus(domainStatus);

    return {
      expiryDate: formatDate(expiryDate),
      daysLeft,
      isProtected: protection.serverProtected,
    };
  } catch (err) {
    console.error("Error fetching domain info:", err.message);
    return { expiryDate: "N/A", daysLeft: 0, isProtected: false };
  }
}
