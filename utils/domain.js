import { whoisDomain } from "whoiser";
import fetch from "node-fetch";

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
  const diffTime = expiry - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}


function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


function parseProtectionStatus(domainStatus) {
  if (!domainStatus) return { serverProtected: false };
  const statusString = Array.isArray(domainStatus)
    ? domainStatus.join(" ").toLowerCase()
    : domainStatus.toLowerCase();

  const serverProtected =
    statusString.includes("serverupdateprohibited") ||
    statusString.includes("servertransferprohibited") ||
    statusString.includes("serverdeleteprohibited") ||
    statusString.includes("client update prohibited") ||
    statusString.includes("client transfer prohibited");

  return { serverProtected };
}


async function getRdapInfo(domain) {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const expiryEvent = data.events?.find(e => e.eventAction === "expiration");
    const status = data.status || [];

    return {
      expiryDate: expiryEvent?.eventDate || null,
      domainStatus: status,
    };
  } catch (err) {
    console.warn(`RDAP lookup failed for ${domain}:`, err.message);
    return {};
  }
}


export async function getDomainInfo(domain) {
  try {
    const rootDomain = extractRootDomain(domain);
    if (!rootDomain) throw new Error("Invalid domain");

    let expiryDate = null;
    let domainStatus = null;

    // Try WHOIS first
    try {
      const data = await whoisDomain(rootDomain, { follow: 2, timeout: 10000 });
      const whoisData =
        data["whois.verisign-grs.com"] ||
        Object.values(data).find((obj) => obj && Object.keys(obj).length > 3) ||
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
        whoisData.Status ||
        "";
    } catch (err) {
      console.warn(`WHOIS lookup failed for ${rootDomain}:`, err.message);
    }

    // Fallback to RDAP if WHOIS is missing expiry
    if (!expiryDate) {
      const rdapData = await getRdapInfo(rootDomain);
      if (rdapData.expiryDate) expiryDate = rdapData.expiryDate;
      if (rdapData.domainStatus) domainStatus = rdapData.domainStatus;
    }

    const daysLeft = getDaysLeft(expiryDate);
    const protection = parseProtectionStatus(domainStatus);

    return {
      expiryDate: formatDate(expiryDate),
      daysLeft,
      isProtected: protection.serverProtected,
    };
  } catch (error) {
    console.error("Error fetching domain info:", error);
    throw new Error("Failed to fetch domain WHOIS/RDAP info");
  }
}
