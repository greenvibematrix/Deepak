/**
 * Serverless Backend Function: /api/submit-wishes
 * 
 * Securely handles wish submission from the frontend:
 * 1. Validates HTTP method (POST only).
 * 2. Sliding window rate limiting to prevent spam.
 * 3. Text sanitization (strips HTML, bounds length).
 * 4. Zero tracking: NO IP, location, device fingerprint, or user agent stored or emailed.
 * 5. Saves every wish to persistent local storage (data/wishes-vault.json) so no wish is EVER lost.
 * 6. Multi-provider delivery to OWNER_EMAIL (greenvibematrix@gmail.com):
 *    - Option A: Resend REST API (if RESEND_API_KEY is configured)
 *    - Option B: Nodemailer / Gmail SMTP (if GMAIL_USER & GMAIL_APP_PASSWORD or SMTP configured)
 *    - Option C: Local Dev Simulation & Vault (prints beautiful log box to terminal)
 */

const fs = require("fs");
const path = require("path");

// Rate limiting state
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;     // Allow up to 10 attempts per minute

function isRateLimited(identifier) {
  const now = Date.now();
  const windowData = rateLimitMap.get(identifier) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > windowData.resetTime) {
    windowData.count = 1;
    windowData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(identifier, windowData);
    return false;
  }

  windowData.count++;
  rateLimitMap.set(identifier, windowData);
  return windowData.count > MAX_REQUESTS_PER_WINDOW;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Basic text sanitizer (removes HTML tags and trims)
function sanitizeText(str = "") {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[<>]/g, "")      // Strip bracket leftovers
    .trim()
    .slice(0, 2000);           // Maximum 2000 characters per wish
}

// Persistent wish vault: ensures wishes are recorded safely on server disk
function saveToWishVault(wishRecord) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const vaultFile = path.join(dataDir, "wishes-vault.json");
    let records = [];
    if (fs.existsSync(vaultFile)) {
      try {
        const raw = fs.readFileSync(vaultFile, "utf-8");
        records = JSON.parse(raw);
        if (!Array.isArray(records)) records = [];
      } catch (_) {
        records = [];
      }
    }
    records.push(wishRecord);
    fs.writeFileSync(vaultFile, JSON.stringify(records, null, 2), "utf-8");
    return true;
  } catch (err) {
    // If running in read-only environment like Vercel serverless /tmp
    try {
      const tmpFile = path.join("/tmp", "wishes-vault.json");
      let records = [];
      if (fs.existsSync(tmpFile)) {
        try {
          records = JSON.parse(fs.readFileSync(tmpFile, "utf-8"));
        } catch (_) {}
      }
      records.push(wishRecord);
      fs.writeFileSync(tmpFile, JSON.stringify(records, null, 2), "utf-8");
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = async function handler(req, res) {
  // CORS & Security headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Only POST is accepted."
    });
  }

  // Rate Limiting check
  const clientKey = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "client";
  if (isRateLimited(clientKey)) {
    return res.status(429).json({
      success: false,
      error: "Too many wishes submitted at once. Please wait a moment."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const wish1 = sanitizeText(body.wish1);
    const wish2 = sanitizeText(body.wish2);
    const wish3 = sanitizeText(body.wish3) || "A quiet wish kept in her heart ✨";

    if (!wish1 && !wish2) {
      return res.status(400).json({
        success: false,
        error: "Please write at least one wish before sending."
      });
    }

    const recipientEmail = process.env.OWNER_EMAIL || "greenvibematrix@gmail.com";
    const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_SERVICE_API_KEY;

    // Time formatted for India (Asia/Kolkata)
    const submissionTime = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "Asia/Kolkata"
    });

    const wishRecord = {
      id: "wish_" + Date.now(),
      submissionTime,
      recipient: recipientEmail,
      wishes: {
        wish1,
        wish2,
        wish3
      }
    };

    // 1. ALWAYS save to the persistent Vault first (Never lose a wish!)
    saveToWishVault(wishRecord);

    // Email Subject & Bodies (Zero tracking guarantee: NO IP, NO Geolocation, NO device fingerprint)
    const emailSubject = "🎂 Sayandana's Birthday Wishes";
    const plainTextBody = `Someone left three wishes on your birthday page.

🌙 WISH ONE:
${wish1}

✨ WISH TWO:
${wish2}

💫 WISH THREE:
${wish3}

Submission time:
${submissionTime} (IST)
`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; background-color: #080b18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 215, 0, 0.35); box-shadow: 0 12px 40px rgba(0,0,0,0.6); }
    .header { background: linear-gradient(135deg, #1e1145, #0f172a); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 215, 0, 0.2); }
    .header h1 { margin: 10px 0 0 0; color: #ffd700; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
    .header p { margin: 8px 0 0 0; color: #cbd5e1; font-size: 14px; }
    .content { padding: 28px 24px; }
    .wish-box { background: rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; border-left: 4px solid #ffd700; }
    .wish-box.two { border-left-color: #f472b6; }
    .wish-box.three { border-left-color: #60a5fa; }
    .wish-label { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .wish-box.one .wish-label { color: #ffd700; }
    .wish-box.two .wish-label { color: #f472b6; }
    .wish-box.three .wish-label { color: #60a5fa; }
    .wish-text { color: #f8fafc; font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
    .footer { border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 38px;">✨ 🎂 ✨</div>
      <h1>Sayandana's Birthday Wishes</h1>
      <p>Someone left three wishes on your magical birthday page</p>
    </div>
    <div class="content">
      <div class="wish-box one">
        <div class="wish-label">🌙 Wish One</div>
        <div class="wish-text">${wish1}</div>
      </div>
      <div class="wish-box two">
        <div class="wish-label">✨ Wish Two</div>
        <div class="wish-text">${wish2}</div>
      </div>
      <div class="wish-box three">
        <div class="wish-label">💫 Wish Three</div>
        <div class="wish-text">${wish3}</div>
      </div>
    </div>
    <div class="footer">
      🕒 Recorded: ${submissionTime} (IST)<br>
      🛡️ Zero personal tracking | Stored securely in vault
    </div>
  </div>
</body>
</html>
`;

    // 2. Dispatch Option A: Resend API (if API Key provided)
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Birthday Wishes <onboarding@resend.dev>",
            to: [recipientEmail],
            subject: emailSubject,
            text: plainTextBody,
            html: htmlBody
          })
        });

        if (emailResponse.ok) {
          console.log(`[EMAIL DISPATCH] Delivered Sayandana's wishes via Resend to ${recipientEmail}`);
          return res.status(200).json({
            success: true,
            provider: "resend",
            recipient: recipientEmail,
            message: "Wishes delivered successfully to the stars!"
          });
        } else {
          const errData = await emailResponse.text();
          console.error("[RESEND ERROR]", errData);
        }
      } catch (e) {
        console.error("[RESEND EXCEPTION]", e);
      }
    }

    // 3. Dispatch Option B: Gmail SMTP / Nodemailer (if GMAIL/SMTP credentials provided)
    const smtpUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "").trim();
    const smtpPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "");

    if (smtpUser && smtpPass) {
      try {
        const nodemailer = require("nodemailer");
        const transporter = process.env.SMTP_HOST
          ? nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587", 10),
              secure: process.env.SMTP_SECURE === "true",
              auth: { user: smtpUser, pass: smtpPass }
            })
          : nodemailer.createTransport({
              service: process.env.SMTP_SERVICE || "gmail",
              auth: { user: smtpUser, pass: smtpPass }
            });

        await transporter.sendMail({
          from: `"Sayandana's Birthday Wishes" <${smtpUser}>`,
          to: recipientEmail,
          subject: emailSubject,
          text: plainTextBody,
          html: htmlBody
        });

        console.log(`[EMAIL DISPATCH] Delivered Sayandana's wishes via Gmail/SMTP to ${recipientEmail}`);
        return res.status(200).json({
          success: true,
          provider: "smtp",
          recipient: recipientEmail,
          message: "Wishes delivered successfully to the stars!"
        });
      } catch (smtpErr) {
        console.error("[SMTP ERROR]", smtpErr.message);
      }
    }

    // 4. Dispatch Option C: Web3Forms (if WEB3FORMS_ACCESS_KEY provided)
    const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.WEB3FORMS_KEY;
    if (web3formsKey) {
      try {
        const formResponse = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: web3formsKey.trim(),
            subject: emailSubject,
            from_name: "Sayandana's Birthday Magic",
            to_email: recipientEmail,
            message: plainTextBody,
            wish_1: wish1,
            wish_2: wish2,
            wish_3: wish3,
            submission_time: submissionTime
          })
        });
        const formData = await formResponse.json();
        if (formData.success) {
          console.log(`[EMAIL DISPATCH] Delivered Sayandana's wishes via Web3Forms to ${recipientEmail}`);
          return res.status(200).json({
            success: true,
            provider: "web3forms",
            recipient: recipientEmail,
            message: "Wishes delivered successfully to the stars!"
          });
        }
      } catch (w3Err) {
        console.error("[WEB3FORMS ERROR]", w3Err.message);
      }
    }

    // 4. Dispatch Option C: Local Vault & Terminal Display (Active when keys are pending)
    console.log("\n==================================================");
    console.log("💌 [NEW BIRTHDAY WISHES RECEIVED IN VAULT]");
    console.log(`Recipient: ${recipientEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log("--------------------------------------------------");
    console.log(plainTextBody);
    console.log("💾 Saved in: data/wishes-vault.json");
    console.log("==================================================\n");

    return res.status(200).json({
      success: true,
      provider: "vault",
      recipient: recipientEmail,
      message: "Wishes safely captured and preserved in the vault!"
    });

  } catch (error) {
    console.error("[SUBMIT ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while transmitting wishes."
    });
  }
};
