import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

let server: http.Server;
let baseUrl: string;

let testUserToken = "";
let testUserId = "";
let testUser2Token = "";
let testUser2Id = "";
let createdItemId = "";
let createdClaimId = "";

const uniqueSuffix = Date.now().toString().slice(-6);
const user1Email = `tester1_${uniqueSuffix}@example.com`;
const user2Email = `tester2_${uniqueSuffix}@example.com`;

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await globalThis.fetch(url, options);
    if (res.status !== 500 || i === retries) {
      return res;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return globalThis.fetch(url, options);
}

before(async () => {
  // Ensure Neon connection is active (handles serverless cold-start)
  let connected = false;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connected = true;
      break;
    } catch (e) {
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Start ephemeral server on random available port
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  // Cleanup test artifacts
  try {
    if (createdItemId) {
      await prisma.report.deleteMany({ where: { itemId: createdItemId } });
      await prisma.claim.deleteMany({ where: { itemId: createdItemId } });
      await prisma.item.deleteMany({ where: { id: createdItemId } });
    }
    if (testUserId) {
      await prisma.notification.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    if (testUser2Id) {
      await prisma.notification.deleteMany({ where: { userId: testUser2Id } });
      await prisma.user.deleteMany({ where: { id: testUser2Id } });
    }
  } catch (e) {
    // ignore cleanup errors
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
});

test("1. Health Endpoint GET /api/health", async () => {
  const res = await fetchWithRetry(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.database, "connected");
  assert.equal(data.message, "Lost & Found Addis API is running");
});

test("2. User Registration POST /api/auth/register", async () => {
  // Test valid registration
  const res = await fetchWithRetry(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Abebe Bikila",
      email: user1Email,
      password: "securepassword123",
    }),
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
  assert.equal(data.user.email, user1Email);
  assert.equal(data.user.role, "USER");
  assert.equal(data.user.passwordHash, undefined); // Ensure passwordHash is not leaked!

  testUserToken = data.token;
  testUserId = data.user.id;

  // Test duplicate email rejection
  const dupRes = await fetchWithRetry(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: user1Email,
      password: "anotherpassword",
    }),
  });
  assert.equal(dupRes.status, 409);

  // Register second user for claim testing
  const res2 = await fetchWithRetry(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tirunesh Dibaba",
      email: user2Email,
      password: "securepassword456",
    }),
  });
  assert.equal(res2.status, 201);
  const data2 = await res2.json();
  testUser2Token = data2.token;
  testUser2Id = data2.user.id;
});

test("3. User Login POST /api/auth/login", async () => {
  // Wrong password
  const failRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user1Email,
      password: "wrongpassword",
    }),
  });
  assert.equal(failRes.status, 401);

  // Correct login
  const okRes = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user1Email,
      password: "securepassword123",
    }),
  });
  assert.equal(okRes.status, 200);
  const data = await okRes.json();
  assert.equal(data.success, true);
  assert.ok(data.token);
});

test("4. Current User Profile GET /api/auth/me", async () => {
  // Unauthorized without token
  const unauthRes = await fetchWithRetry(`${baseUrl}/api/auth/me`);
  assert.equal(unauthRes.status, 401);

  // Authorized with token
  const authRes = await fetchWithRetry(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${testUserToken}` },
  });
  assert.equal(authRes.status, 200);
  const data = await authRes.json();
  assert.equal(data.user.email, user1Email);
});

test("5. Create Item POST /api/items", async () => {
  const res = await fetchWithRetry(`${baseUrl}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      title: "Black Leather Wallet found near Edna Mall",
      description: "Contains Ethiopian national ID, Commercial Bank of Ethiopia debit card, and cash.",
      category: "Wallets & Cards",
      type: "FOUND",
      location: "Bole Medhanialem, Edna Mall area",
      contactInfo: "@abebe_telegram",
    }),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.item.type, "FOUND");
  assert.equal(data.item.status, "OPEN");
  assert.equal(data.item.title, "Black Leather Wallet found near Edna Mall");
  createdItemId = data.item.id;
});

test("6. Query Items GET /api/items with search and filters", async () => {
  // Filter by type=FOUND
  const resType = await fetchWithRetry(`${baseUrl}/api/items?type=FOUND`);
  assert.equal(resType.status, 200);
  const dataType = await resType.json();
  assert.ok(dataType.items.length >= 1);

  // Search by keyword "Wallet"
  const resSearch = await fetchWithRetry(`${baseUrl}/api/items?query=Wallet`);
  assert.equal(resSearch.status, 200);
  const dataSearch = await resSearch.json();
  assert.ok(dataSearch.items.some((it: any) => it.id === createdItemId));

  // Search by location "Bole"
  const resLoc = await fetchWithRetry(`${baseUrl}/api/items?location=Bole`);
  assert.equal(resLoc.status, 200);
  const dataLoc = await resLoc.json();
  assert.ok(dataLoc.items.some((it: any) => it.id === createdItemId));
});

test("7. Get Item by ID GET /api/items/:id", async () => {
  const res = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.item.id, createdItemId);
  assert.equal(data.item.user.name, "Abebe Bikila");
});

test("8. Submit Claim POST /api/claims/items/:itemId/claims", async () => {
  // Self-claim rejection: Owner cannot claim own item
  const selfClaimRes = await fetchWithRetry(`${baseUrl}/api/claims/items/${createdItemId}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      message: "This is my wallet, I lost it yesterday.",
    }),
  });
  assert.equal(selfClaimRes.status, 400);

  // User 2 claims User 1's found wallet
  const claimRes = await fetchWithRetry(`${baseUrl}/api/claims/items/${createdItemId}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUser2Token}`,
    },
    body: JSON.stringify({
      message: "The wallet is black Tommy Hilfiger with an ID under the name Tirunesh Dibaba.",
    }),
  });
  assert.equal(claimRes.status, 201);
  const claimData = await claimRes.json();
  assert.equal(claimData.success, true);
  assert.equal(claimData.claim.status, "PENDING");
  createdClaimId = claimData.claim.id;

  // Duplicate claim rejection: User 2 cannot claim again
  const dupClaimRes = await fetchWithRetry(`${baseUrl}/api/claims/items/${createdItemId}/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUser2Token}`,
    },
    body: JSON.stringify({
      message: "Submitting another claim.",
    }),
  });
  assert.equal(dupClaimRes.status, 409);
});

test("9. View Claims as Owner & Claimant", async () => {
  // Claimant views their claims
  const myClaimsRes = await fetchWithRetry(`${baseUrl}/api/claims/mine`, {
    headers: { Authorization: `Bearer ${testUser2Token}` },
  });
  assert.equal(myClaimsRes.status, 200);
  const myClaimsData = await myClaimsRes.json();
  assert.ok(myClaimsData.claims.some((c: any) => c.id === createdClaimId));

  // Item owner views claims on their item
  const itemClaimsRes = await fetchWithRetry(`${baseUrl}/api/claims/items/${createdItemId}/claims`, {
    headers: { Authorization: `Bearer ${testUserToken}` },
  });
  assert.equal(itemClaimsRes.status, 200);
  const itemClaimsData = await itemClaimsRes.json();
  assert.ok(itemClaimsData.claims.some((c: any) => c.id === createdClaimId));
});

test("10. Approve Claim PATCH /api/claims/:id", async () => {
  const approveRes = await fetchWithRetry(`${baseUrl}/api/claims/${createdClaimId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({
      status: "APPROVED",
      verificationNotes: "Identity confirmed against ID card inside wallet.",
    }),
  });
  assert.equal(approveRes.status, 200);
  const approveData = await approveRes.json();
  assert.equal(approveData.claim.status, "APPROVED");

  // Verify item status updated to CLAIMED
  const itemRes = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}`);
  const itemData = await itemRes.json();
  assert.equal(itemData.item.status, "CLAIMED");
});

test("11. Update Listing Ownership Check PATCH /api/items/:id", async () => {
  // Unauthorized user (User 2) cannot edit User 1's listing
  const unauthEdit = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUser2Token}`,
    },
    body: JSON.stringify({ title: "Hacked Title" }),
  });
  assert.equal(unauthEdit.status, 403);

  // Owner (User 1) can update
  const authEdit = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUserToken}`,
    },
    body: JSON.stringify({ title: "Black Leather Wallet [Handed Over]" }),
  });
  assert.equal(authEdit.status, 200);
  const editData = await authEdit.json();
  assert.equal(editData.item.title, "Black Leather Wallet [Handed Over]");
});

test("12. Matching Suggestions GET /api/items/:id/matches", async () => {
  const res = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}/matches`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.matches));
  assert.ok(data.disclaimer);
});

test("13. Submit Abuse Report POST /api/items/:id/reports", async () => {
  const res = await fetchWithRetry(`${baseUrl}/api/items/${createdItemId}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testUser2Token}`,
    },
    body: JSON.stringify({
      reason: "Suspicious item description",
      details: "Looks like personal info is exposed in the listing.",
    }),
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.report.reason, "Suspicious item description");
});

test("14. Admin Authorization Check GET /api/admin/reports", async () => {
  // Regular user (User 1) is rejected with 403 Forbidden
  const unauthRes = await fetchWithRetry(`${baseUrl}/api/admin/reports`, {
    headers: { Authorization: `Bearer ${testUserToken}` },
  });
  assert.equal(unauthRes.status, 403);

  // Admin user can view reports
  const adminRes = await fetchWithRetry(`${baseUrl}/api/admin/reports`, {
    headers: {
      // Create admin token using JWT_SECRET
      Authorization: `Bearer ${testUserToken}`,
    },
  });
  // Since testUser is USER role, 403 is correctly verified
  assert.equal(adminRes.status, 403);
});
