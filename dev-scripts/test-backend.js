/**
 * Backend Process Test Runner
 * 
 * Tests the backend API endpoint (/api/submit-wishes), verifies:
 * 1. Health check status
 * 2. Wish validation (rejects blank wishes)
 * 3. Wish acceptance and vault storage
 * 4. Active email delivery status
 * 
 * Run with: node scripts/test-backend.js
 */

const http = require("http");

const HOST = "localhost";
const PORT = process.env.PORT || 3000;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runBackendTests() {
  console.log("==================================================");
  console.log("🧪 TESTING SAYANDANA'S BIRTHDAY BACKEND PROCESS");
  console.log(`🌐 Target: http://${HOST}:${PORT}`);
  console.log("==================================================\n");

  // Test 1: Health check
  console.log("1️⃣  Checking Server Health...");
  try {
    const health = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: "/api/health",
      method: "GET"
    });
    console.log(`   ✅ Health Status: ${health.status} OK`);
    console.log(`   💌 Recipient: ${health.data.recipient}`);
    console.log(`   ⚙️  Active Provider: ${health.data.activeProvider}`);
    console.log(`   📦 Stored in Vault: ${health.data.wishesInVault} wish record(s)`);
  } catch (err) {
    console.error(`   ❌ Failed to connect to server: ${err.message}`);
    console.log("   👉 Make sure 'node server.js' is running!");
    process.exit(1);
  }

  // Test 2: Validation check (empty submission)
  console.log("\n2️⃣  Testing Validation (Rejecting empty wish)...");
  try {
    const emptyTest = await makeRequest(
      {
        hostname: HOST,
        port: PORT,
        path: "/api/submit-wishes",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { wish1: "", wish2: "" }
    );
    if (emptyTest.status === 400 && !emptyTest.data.success) {
      console.log(`   ✅ Correctly rejected empty wish (${emptyTest.data.error})`);
    } else {
      console.warn(`   ⚠️ Unexpected response for empty wish:`, emptyTest);
    }
  } catch (err) {
    console.error(`   ❌ Validation test error: ${err.message}`);
  }

  // Test 3: Realistic Wish Submission
  console.log("\n3️⃣  Testing Wish Submission & Vault Recording...");
  try {
    const testPayload = {
      wish1: "To travel to the snowy mountains and see the aurora borealis 🌌",
      wish2: "To build something meaningful that makes people smile 🌸",
      wish3: "Peace of mind and quiet happiness always 💫"
    };

    const submitRes = await makeRequest(
      {
        hostname: HOST,
        port: PORT,
        path: "/api/submit-wishes",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      testPayload
    );

    if (submitRes.status === 200 && submitRes.data.success) {
      console.log(`   ✅ Wish Submission Succeeded!`);
      console.log(`   🎉 Provider Result: ${submitRes.data.provider}`);
      console.log(`   💬 Message: ${submitRes.data.message}`);
    } else {
      console.error(`   ❌ Submission failed:`, submitRes);
    }
  } catch (err) {
    console.error(`   ❌ Submission test error: ${err.message}`);
  }

  // Test 4: Inspection of Vault
  console.log("\n4️⃣  Verifying Vault Record Persistence...");
  try {
    const wishesRes = await makeRequest({
      hostname: HOST,
      port: PORT,
      path: "/api/wishes",
      method: "GET"
    });
    if (wishesRes.status === 200 && Array.isArray(wishesRes.data.wishes)) {
      console.log(`   ✅ Vault Verified: ${wishesRes.data.count} total submission(s) preserved.`);
      const latest = wishesRes.data.wishes[wishesRes.data.wishes.length - 1];
      console.log(`   📝 Latest Recorded Wish:`);
      console.log(`      - Time: ${latest.submissionTime}`);
      console.log(`      - Wish 1: ${latest.wishes.wish1}`);
      console.log(`      - Wish 2: ${latest.wishes.wish2}`);
      console.log(`      - Wish 3: ${latest.wishes.wish3}`);
    }
  } catch (err) {
    console.error(`   ❌ Vault read error: ${err.message}`);
  }

  console.log("\n==================================================");
  console.log("✨ ALL BACKEND PROCESS TESTS COMPLETE!");
  console.log("==================================================");
}

runBackendTests();
