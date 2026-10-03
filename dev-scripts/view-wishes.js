/**
 * CLI Tool to View All Captured Birthday Wishes
 * 
 * Run with: npm run view:wishes OR node scripts/view-wishes.js
 */

const fs = require("fs");
const path = require("path");

const vaultPath = path.join(process.cwd(), "data", "wishes-vault.json");

if (!fs.existsSync(vaultPath)) {
  console.log("\n📦 Wishes Vault is empty. No wishes have been recorded yet.");
  console.log("Submit wishes from the website or run 'npm run test:backend' to test.\n");
  process.exit(0);
}

try {
  const content = fs.readFileSync(vaultPath, "utf-8");
  const wishes = JSON.parse(content);

  if (!Array.isArray(wishes) || wishes.length === 0) {
    console.log("\n📦 Wishes Vault is currently empty.\n");
    process.exit(0);
  }

  console.log("==================================================");
  console.log(`🎂 SAYANDANA'S BIRTHDAY WISHES VAULT (${wishes.length} Recorded)`);
  console.log("==================================================\n");

  wishes.forEach((item, index) => {
    console.log(`💌 ENTRY #${index + 1} — ${item.submissionTime}`);
    console.log(`Recipient: ${item.recipient}`);
    console.log("--------------------------------------------------");
    console.log(`🌙 Wish 1: ${item.wishes.wish1}`);
    console.log(`✨ Wish 2: ${item.wishes.wish2}`);
    console.log(`💫 Wish 3: ${item.wishes.wish3}`);
    console.log("==================================================\n");
  });
} catch (err) {
  console.error("Error reading wishes vault:", err.message);
}
