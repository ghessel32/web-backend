import tls from "tls";

export function getSSLCertificate(hostname, port = 443) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(port, hostname, { servername: hostname }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();

      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error("No certificate found"));
        return;
      }

      // Calculate days left
      const validTo = new Date(cert.valid_to);
      const validFrom = new Date(cert.valid_from);
      const now = new Date();
      const daysLeft = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));

      

      // Determine certificate type (rough guess from subjectAltName and issuer)
      let certType = "DV"; // Default Domain Validated
      if (
        cert.issuer &&
        cert.issuer.O &&
        cert.issuer.O.toLowerCase().includes("ca")
      ) {
        certType = "DV";
      }

      // Assume Auto Renewal for Let's Encrypt
      let autoRenewal = cert.issuer.CN.includes("Let's Encrypt")
        ? "Yes"
        : "Unknown";

      resolve({
        Status: "Valid & Secure",
        Issuer: cert.issuer.CN,
        "Days Left": `${daysLeft} days`,
        "Certificate Type": certType,
        "Auto Renewal": autoRenewal,
        "Valid Until": validTo.toDateString(),
      });
    });

    socket.on("error", (err) => reject(err));
  });
}
