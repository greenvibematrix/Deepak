/**
 * Local Development & Production Server for Sayandana's Magical Birthday Website
 * 
 * Provides:
 * - Static file serving for /public
 * - Full parity with Vercel serverless /api/submit-wishes endpoint
 * - Secure persistent vault: saves every wish to data/wishes-vault.json
 * - Health check endpoint: /api/health
 * - Local wishes viewing endpoint: /api/wishes
 * - Multi-provider email delivery: Resend API or Gmail App Password
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const submitWishesHandler = require("./api/submit-wishes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
app.use(express.static(path.join(__dirname, "public")));

// API Endpoint for wish submission (mirrors Vercel serverless function)
app.post("/api/submit-wishes", (req, res) => {
  return submitWishesHandler(req, res);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dataDir = path.join(__dirname, "data");
  const vaultFile = path.join(dataDir, "wishes-vault.json");
  let savedCount = 0;
  if (fs.existsSync(vaultFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(vaultFile, "utf-8"));
      savedCount = Array.isArray(data) ? data.length : 0;
    } catch (_) {}
  }

  const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
  const hasGmail = !!((process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS));

  let provider = "vault (local simulation)";
  if (hasResend) provider = "Resend API";
  else if (hasGmail) provider = "Gmail / SMTP";

  res.json({
    status: "ok",
    version: "1.0.0",
    recipient: process.env.OWNER_EMAIL || "greenvibematrix@gmail.com",
    activeProvider: provider,
    wishesInVault: savedCount,
    serverTime: new Date().toISOString()
  });
});

// View saved wishes (useful for local admin inspection)
app.get("/api/wishes", (req, res) => {
  const vaultFile = path.join(__dirname, "data", "wishes-vault.json");
  if (!fs.existsSync(vaultFile)) {
    return res.json({ wishes: [], message: "No wishes have been recorded yet." });
  }
  try {
    const raw = fs.readFileSync(vaultFile, "utf-8");
    const wishes = JSON.parse(raw);
    res.json({ count: wishes.length, wishes });
  } catch (err) {
    res.status(500).json({ error: "Failed to read wishes vault" });
  }
});

// Fallback to index.html for any SPA navigation
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start listening on 0.0.0.0 only when running locally (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
    const hasGmail = !!((process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS));
    const hasWeb3Forms = !!(process.env.WEB3FORMS_ACCESS_KEY || process.env.WEB3FORMS_KEY);

    console.log("==================================================");
    console.log("✨ SAYANDANA'S MAGICAL BIRTHDAY WEBSITE (BACKEND)");
    console.log(`💻 Local Computer:     http://localhost:${PORT}`);
    console.log(`📱 Mobile (Same Wi-Fi): http://10.3.239.48:${PORT}`);
    console.log(`💌 Target Recipient:    ${process.env.OWNER_EMAIL || "greenvibematrix@gmail.com"}`);
    
    if (hasResend) {
      console.log("📧 Active Mode: LIVE EMAIL via Resend API");
    } else if (hasGmail) {
      console.log("📧 Active Mode: LIVE EMAIL via Gmail / Nodemailer SMTP");
    } else if (hasWeb3Forms) {
      console.log("📧 Active Mode: LIVE EMAIL via Web3Forms API");
    } else {
      console.log("💡 Active Mode: VAULT MODE (Saved to data/wishes-vault.json + console)");
      console.log("   To enable live emails to greenvibematrix@gmail.com, see .env");
    }
    console.log(`🛡️  Zero Tracking: Enabled (NO IP, NO fingerprints logged)`);
    console.log("==================================================");
  });
}

module.exports = app;
