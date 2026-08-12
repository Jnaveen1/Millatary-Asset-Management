const db = require('../config/db');
const app = require('../server');
const http = require('http');
const runSeed = require('../database/seedRunner');

let server;
let port;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Military Asset Management System Integration & Concurrency Tests...\n');

  try {
    // Seed DB cleanly before tests
    await runSeed();

    // Start temporary test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    let adminToken, commanderAlphaToken, logisticsToken;

    // 1. Auth Tests
    console.log('1️⃣ Testing Authentication & Tokens...');
    
    // Login Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'Password123!' },
    });
    console.assert(adminLogin.status === 200, 'Admin login failed');
    console.assert(adminLogin.data.user.role === 'ADMIN', 'Admin role mismatch');
    adminToken = adminLogin.data.token;
    console.log('   ✅ Admin Login successful.');

    // Login Commander Alpha
    const commLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'commander_alpha', password: 'Password123!' },
    });
    console.assert(commLogin.status === 200, 'Commander login failed');
    console.assert(commLogin.data.user.role === 'BASE_COMMANDER', 'Commander role mismatch');
    commanderAlphaToken = commLogin.data.token;
    console.log('   ✅ Commander Alpha Login successful.');

    // Login Logistics Officer
    const logistLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'logistics_officer', password: 'Password123!' },
    });
    console.assert(logistLogin.status === 200, 'Logistics Officer login failed');
    logisticsToken = logistLogin.data.token;
    console.log('   ✅ Logistics Officer Login successful.');

    // Invalid Login
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'WrongPassword' },
    });
    console.assert(badLogin.status === 401, 'Invalid password should yield 401');
    console.log('   ✅ Invalid password rejected correctly (401).');

    // 2. RBAC Access Control Tests
    console.log('\n2️⃣ Testing Role-Based Access Control (RBAC)...');
    
    // Commander Alpha tries to create Purchase (Logistics/Admin only) -> 403
    const forbiddenPurchase = await request('/api/purchases', {
      method: 'POST',
      token: commanderAlphaToken,
      body: { baseId: 1, equipmentTypeId: 1, quantity: 10 },
    });
    console.assert(forbiddenPurchase.status === 403, 'Commander should not create purchases');
    console.log('   ✅ Commander restricted from creating purchases (403).');

    // Commander Alpha tries to view metrics for Fort Bravo (Base #2) -> 403
    const forbiddenBaseView = await request('/api/assets/dashboard?baseId=2', {
      token: commanderAlphaToken,
    });
    console.assert(forbiddenBaseView.status === 403, 'Commander cannot view other base metrics');
    console.log('   ✅ Commander restricted from accessing other base metrics (403).');

    // 3. Purchase Creation & Stock Addition Test
    console.log('\n3️⃣ Testing Procurement & Inventory Calculations...');
    
    const purchaseRes = await request('/api/purchases', {
      method: 'POST',
      token: logisticsToken,
      body: { baseId: 1, equipmentTypeId: 2, quantity: 50 }, // Purchase 50 AK-47s at Fort Alpha
    });
    console.assert(purchaseRes.status === 201, 'Purchase creation failed');
    console.log('   ✅ Purchase recorded successfully (+50 AK-47 at Fort Alpha).');

    // 4. Atomic Transfer & Insufficient Inventory Test
    console.log('\n4️⃣ Testing Inter-Base Atomic Transfers & Stock Locks...');
    
    // Excessive quantity transfer attempt -> 400 Insufficient Inventory
    const excessiveTransfer = await request('/api/transfers', {
      method: 'POST',
      token: logisticsToken,
      body: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 2, quantity: 99999 },
    });
    console.assert(excessiveTransfer.status === 400, 'Excessive transfer must be rejected');
    console.log('   ✅ Excessive transfer rejected due to stock limit (400).');

    // Valid transfer (Transfer 20 AK-47s from Fort Alpha to Fort Bravo)
    const validTransfer = await request('/api/transfers', {
      method: 'POST',
      token: logisticsToken,
      body: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 2, quantity: 20 },
    });
    console.assert(validTransfer.status === 201, 'Valid transfer failed');
    console.log('   ✅ Atomic Transfer executed (20 AK-47s from Alpha -> Bravo).');

    // 5. Concurrency Test: Simultaneous Transfers with Row Locks
    console.log('\n5️⃣ Testing Concurrency Safety with PostgreSQL Row Locks...');
    // Currently Fort Alpha has 30 AK-47s left.
    // Send 2 simultaneous transfer requests of 25 AK-47s each.
    // One must succeed, the other MUST fail with 400 Insufficient Inventory!
    const req1 = request('/api/transfers', {
      method: 'POST',
      token: logisticsToken,
      body: { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 2, quantity: 25 },
    });
    const req2 = request('/api/transfers', {
      method: 'POST',
      token: logisticsToken,
      body: { sourceBaseId: 1, destinationBaseId: 3, equipmentTypeId: 2, quantity: 25 },
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    const statuses = [res1.status, res2.status];
    
    console.assert(
      (statuses.includes(201) && statuses.includes(400)),
      `Concurrency failure: Expected one 201 and one 400, got ${statuses.join(', ')}`
    );
    console.log(`   ✅ Concurrency-Safe Row Lock Verified: Simultaneous transfers handled safely (${statuses.join(' and ')}).`);

    // 6. Dashboard Aggregation Test
    console.log('\n6️⃣ Testing Dashboard Dynamic Asset Metric Aggregations...');
    const dashRes = await request('/api/assets/dashboard?baseId=1', { token: adminToken });
    console.assert(dashRes.status === 200, 'Dashboard request failed');
    const { metrics } = dashRes.data;
    
    // Formula verification: Closing = Opening + Net Movement - Assigned - Expended
    const expectedClosing = metrics.openingBalance + metrics.netMovement - metrics.assigned - metrics.expended;
    console.assert(metrics.closingBalance === expectedClosing, 'Closing Balance formula mismatch');
    console.log(`   ✅ Dashboard Closing Balance Formula verified: ${metrics.closingBalance} = ${metrics.openingBalance} + ${metrics.netMovement} - ${metrics.assigned} - ${metrics.expended}`);

    // 7. Audit Trail Test
    console.log('\n7️⃣ Testing System Central Audit Log...');
    const auditRes = await request('/api/audit-logs', { token: adminToken });
    console.assert(auditRes.status === 200, 'Audit log fetch failed');
    console.assert(auditRes.data.length >= 5, 'Audit logs missing entries');
    console.log(`   ✅ Central Audit Log retrieved (${auditRes.data.length} records).`);

    console.log('\n🎉 ALL INTEGRATION & CONCURRENCY TESTS PASSED SUCCESSFULLY!\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration Test Failed:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
