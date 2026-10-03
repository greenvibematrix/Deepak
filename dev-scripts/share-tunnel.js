/**
 * Shareable Mobile Link Generator
 * Creates an instant public HTTPS link that can be shared with Sayandana on WhatsApp / SMS / Instagram.
 */

const localtunnel = require("localtunnel");

async function startTunnel() {
  const subdomain = "sayandana-magic-" + Math.floor(100 + Math.random() * 900);
  try {
    const tunnel = await localtunnel({ port: 3000, subdomain });
    console.log("\n==================================================");
    console.log("✨ SAYANDANA'S BIRTHDAY WEBSITE — PUBLIC LINK");
    console.log("==================================================");
    console.log("📱 SHAREABLE HTTPS LINK FOR MOBILE:");
    console.log(`👉 ${tunnel.url}`);
    console.log("==================================================");
    console.log("Anyone can open this link from anywhere on their phone!");
    console.log("==================================================\n");

    tunnel.on("close", () => {
      console.log("Tunnel was closed.");
    });
    tunnel.on("error", (err) => {
      console.error("Tunnel error:", err.message);
    });
  } catch (err) {
    console.error("Failed to start tunnel:", err.message);
    // Retry with random subdomain
    try {
      const fallback = await localtunnel({ port: 3000 });
      console.log(`👉 Fallback Public Link: ${fallback.url}`);
    } catch (e) {
      console.error("Fallback error:", e.message);
    }
  }
}

startTunnel();
