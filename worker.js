// worker.js

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // PUBLIC WORKSHOPS (existing)
    if (path === "/api/staff" && request.method === "GET") return listStaff(env);
    if (path === "/api/staff/profile" && request.method === "GET") return staffProfile(url, env);
    if (path === "/api/availability" && request.method === "GET") return getAvailability(url, env);
    if (path === "/api/book" && request.method === "POST") return createBooking(request, env);
    if (path === "/api/paypal/capture" && request.method === "POST") return captureOrder(request, env);
    if (path === "/api/user/bookings" && request.method === "GET") return userBookings(url, env);

    // ADMIN (existing)
    if (path === "/api/admin/bookings" && request.method === "GET")
      return admin(request, env, () => listBookings(env));
    if (path === "/api/admin/payouts" && request.method === "GET")
      return admin(request, env, () => listPayouts(env));
    if (path === "/api/admin/payouts/mark-paid" && request.method === "POST")
      return admin(request, env, () => markPayoutPaid(request, env));
    if (path === "/api/admin/availability/set" && request.method === "POST")
      return admin(request, env, () => setAvailability(request, env));

    // NETWORK PUBLIC (old)
    if (path === "/api/network/list" && request.method === "GET") return listNetworkProfiles(env);
    if (path === "/api/network/profile" && request.method === "GET") return getNetworkProfile(url, env);
    if (path === "/api/network/pay" && request.method === "POST") return networkPay(request, env);
    if (path === "/api/network/pay/capture" && request.method === "POST") return networkCapture(request, env);

    // NETWORK PUBLIC — NEW FEEDS
    if (path === "/api/network/vendors" && request.method === "GET") return listVendors(env);
    if (path === "/api/network/services" && request.method === "GET") return listServices(env);
    if (path === "/api/network/products" && request.method === "GET") return listProducts(env);
    if (path === "/api/network/explore" && request.method === "GET") return listExplore(env);
    if (path === "/api/network/vendor" && request.method === "GET") return getVendorFull(url, env);
    if (path === "/api/network/workshops" && request.method === "GET") return listWorkshops(env);

    // STAFF PORTAL (Network)
    if (path === "/api/staff/me" && request.method === "GET") return staffMe(url, env);
    if (path === "/api/staff/profile/update" && request.method === "POST") return staffUpdateProfile(request, env);
    if (path === "/api/staff/products" && request.method === "GET") return staffProducts(url, env);
    if (path === "/api/staff/product/create" && request.method === "POST") return staffCreateProduct(request, env);
    if (path === "/api/staff/product/update" && request.method === "POST") return staffUpdateProduct(request, env);
    if (path === "/api/staff/product/delete" && request.method === "POST") return staffDeleteProduct(request, env);
    if (path === "/api/staff/orders" && request.method === "GET") return staffOrders(url, env);
    if (path === "/api/staff/payouts" && request.method === "GET") return staffPayouts(url, env);

    // ADMIN NETWORK
    if (path === "/api/admin/network/profiles" && request.method === "GET")
      return admin(request, env, () => adminListProfiles(env));
    if (path === "/api/admin/network/products" && request.method === "GET")
      return admin(request, env, () => adminListProducts(env));
    if (path === "/api/admin/network/block" && request.method === "POST")
      return admin(request, env, () => adminBlockProfile(request, env));
    if (path === "/api/admin/network/commission" && request.method === "POST")
      return admin(request, env, () => adminSetCommission(request, env));
    if (path === "/api/admin/network/free-window" && request.method === "POST")
      return admin(request, env, () => adminSetFreeWindow(request, env));
    if (path === "/api/admin/network/analytics" && request.method === "GET")
      return admin(request, env, () => adminAnalytics(env));

    return new Response("Not found", { status: 404 });
  }
};

// utils
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function admin(request, env, handler) {
  if (request.headers.get("x-admin-token") !== env.ADMIN_TOKEN)
    return new Response("Unauthorized", { status: 401 });
  return handler();
}

// unified notification (email only)
async function notifyEvent(type, to, data, env) {
  if (!env.EMAIL_WEBHOOK_URL || !to) return;

  await fetch(env.EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, to, data })
  });
}

// PayPal
async function paypalToken(env) {
  const creds = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await res.json();
  return data.access_token;
}

/* ========= EXISTING WORKSHOP LOGIC ========= */

// STAFF (legacy workshops)
async function listStaff(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM staff WHERE active = 1"
  ).all();
  return json(results);
}

async function staffProfile(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);
  const staff = await env.DB_network.prepare("SELECT * FROM staff WHERE id = ?")
    .bind(id)
    .first();
  if (!staff) return json({ error: "Not found" }, 404);
  return json(staff);
}

// AVAILABILITY
async function getAvailability(url, env) {
  const staffId = url.searchParams.get("staffId");
  const discipline = url.searchParams.get("discipline");
  const date = url.searchParams.get("date");

  let query = "SELECT * FROM availability WHERE isBooked = 0";
  const params = [];
  if (staffId) {
    query += " AND staffId = ?";
    params.push(staffId);
  }
  if (discipline) {
    query += " AND discipline = ?";
    params.push(discipline);
  }
  if (date) {
    query += " AND date = ?";
    params.push(date);
  }

  const stmt = env.DB_network.prepare(query);
  const bound = params.length ? stmt.bind(...params) : stmt;
  const { results } = await bound.all();
  return json(results);
}

async function setAvailability(request, env) {
  const body = await request.json();
  const { staffId, discipline, slots } = body;

  if (!staffId || !discipline || !Array.isArray(slots))
    return json({ error: "Invalid payload" }, 400);

  const now = new Date().toISOString();
  const stmt = env.DB_network.prepare(
    `INSERT INTO availability (id, staffId, discipline, date, time, isBooked, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  );

  for (const s of slots) {
    await stmt
      .bind(crypto.randomUUID(), staffId, discipline, s.date, s.time, now)
      .run();
  }

  return json({ ok: true });
}

// BOOKING
async function createBooking(request, env) {
  const body = await request.json();
  const { name, email, discipline, instructor, date, time, notes, phone } = body;

  if (!name || !email || !discipline || !instructor || !date || !time)
    return json({ error: "Missing fields" }, 400);

  const price = instructor === "clay" ? 200 : 80;
  const instructorId = instructor === "clay" ? "staff_clay" : "staff_team";

  const slot = await env.DB_network.prepare(
    `SELECT * FROM availability
     WHERE staffId = ? AND discipline = ? AND date = ? AND time = ? AND isBooked = 0`
  )
    .bind(instructorId, discipline, date, time)
    .first();

  if (slot) {
    await env.DB_network.prepare(
      "UPDATE availability SET isBooked = 1 WHERE id = ?"
    )
      .bind(slot.id)
      .run();
  }

  const token = await paypalToken(env);

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: price.toString() },
          description: `Beltline Workshop — ${discipline}`
        }
      ],
      application_context: {
        return_url: `${env.SITE_URL}/pages/workshops.html?paypal=return`,
        cancel_url: `${env.SITE_URL}/pages/workshops.html?paypal=cancel`
      }
    })
  });

  const order = await orderRes.json();

  const bookingId = crypto.randomUUID();
  await env.DB_network.prepare(
    `INSERT INTO bookings
     (id, userName, userEmail, userPhone, discipline, instructorId, instructorType, date, time, notes, price, paymentStatus, paypalOrderId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`
  )
    .bind(
      bookingId,
      name,
      email,
      phone || "",
      discipline,
      instructorId,
      instructor,
      date,
      time,
      notes || "",
      price,
      order.id
    )
    .run();

  const approveLink = order.links.find(l => l.rel === "approve")?.href;
  return json({ approveUrl: approveLink });
}

// CAPTURE
async function captureOrder(request, env) {
  const { orderId } = await request.json();
  if (!orderId) return json({ error: "Missing orderId" }, 400);

  const token = await paypalToken(env);

  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const data = await res.json();
  if (data.status !== "COMPLETED")
    return json({ error: "Payment not completed" }, 400);

  const booking = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE paypalOrderId = ?"
  )
    .bind(orderId)
    .first();

  if (!booking) return json({ error: "Booking not found" }, 404);

  await env.DB_network.prepare(
    `UPDATE bookings SET paymentStatus = 'paid' WHERE id = ?`
  )
    .bind(booking.id)
    .run();

  const staff = await env.DB_network.prepare("SELECT * FROM staff WHERE id = ?")
    .bind(booking.instructorId)
    .first();

  const amountOwed =
    staff.rateType === "percent"
      ? booking.price * staff.rateValue
      : staff.rateValue;

  await env.DB_network.prepare(
    `INSERT INTO payouts (id, staffId, bookingId, amountOwed, status, createdAt)
     VALUES (?, ?, ?, ?, 'unpaid', datetime('now'))`
  )
    .bind(crypto.randomUUID(), staff.id, booking.id, amountOwed)
    .run();

  await notifyEvent("booking_confirmation", booking.userEmail, booking, env);

  return json({ success: true });
}

// USER DASHBOARD
async function userBookings(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM bookings WHERE userEmail = ? ORDER BY createdAt DESC"
  )
    .bind(email)
    .all();

  return json(results);
}

// ADMIN (existing)
async function listBookings(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM bookings ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function listPayouts(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM payouts ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function markPayoutPaid(request, env) {
  const { payoutId } = await request.json();
  if (!payoutId) return json({ error: "Missing payoutId" }, 400);

  const payout = await env.DB_network.prepare(
    "SELECT * FROM payouts WHERE id = ?"
  )
    .bind(payoutId)
    .first();

  if (!payout) return json({ error: "Payout not found" }, 404);

  await env.DB_network.prepare(
    `UPDATE payouts SET status='paid', paidAt=datetime('now') WHERE id=?`
  )
    .bind(payoutId)
    .run();

  const staff = await env.DB_network.prepare(
    "SELECT * FROM staff WHERE id = ?"
  )
    .bind(payout.staffId)
    .first();

  if (staff && staff.email) {
    await notifyEvent("payout_ready", staff.email, payout, env);
  }

  return json({ ok: true });
}

/* ========= NETWORK LOGIC (EXISTING) ========= */

// PUBLIC NETWORK (old profiles/products)
async function listNetworkProfiles(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, name, title, category, qrSlug FROM network_profiles WHERE approved = 1 AND isBlocked = 0"
  ).all();
  return json(results);
}

async function getNetworkProfile(url, env) {
  const slug = url.searchParams.get("profile");
  if (!slug) return json({ error: "Missing profile slug" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT * FROM network_profiles WHERE qrSlug = ? AND approved = 1"
  )
    .bind(slug)
    .first();

  if (!profile) return json({ error: "Profile not found" }, 404);

  const { results: products } = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE ownerId = ? AND active = 1"
  )
    .bind(profile.id)
    .all();

  return json({ profile, products });
}

// STAFF PORTAL (Network)
async function staffMe(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT * FROM network_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!profile) return json({ error: "Not found" }, 404);
  return json(profile);
}

async function staffUpdateProfile(request, env) {
  const body = await request.json();
  const { email, name, title, bio, instagram, website } = body;

  if (!email) return json({ error: "Missing email" }, 400);

  await env.DB_network.prepare(
    `UPDATE network_profiles
     SET name = ?, title = ?, bio = ?, instagram = ?, website = ?
     WHERE email = ?`
  )
    .bind(name || "", title || "", bio || "", instagram || "", website || "", email)
    .run();

  await notifyEvent("profile_update", email, { email, name, title, bio, instagram, website }, env);

  return json({ ok: true });
}

async function staffProducts(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT id FROM network_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!profile) return json({ error: "Profile not found" }, 404);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE ownerId = ? AND active = 1"
  )
    .bind(profile.id)
    .all();

  return json(results);
}

async function staffCreateProduct(request, env) {
  const body = await request.json();
  const { email, type, name, description, price, date, time } = body;

  if (!email || !type || !name || !price)
    return json({ error: "Missing fields" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT id FROM network_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!profile) return json({ error: "Profile not found" }, 404);

  await env.DB_network.prepare(
    `INSERT INTO network_products
     (id, ownerId, type, name, description, price, date, time, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  )
    .bind(
      crypto.randomUUID(),
      profile.id,
      type,
      name,
      description || "",
      price,
      date || null,
      time || null
    )
    .run();

  return json({ ok: true });
}

async function staffUpdateProduct(request, env) {
  const body = await request.json();
  const { productId, name, description, price } = body;

  if (!productId) return json({ error: "Missing productId" }, 400);

  await env.DB_network.prepare(
    `UPDATE network_products
     SET name = ?, description = ?, price = ?
     WHERE id = ?`
  )
    .bind(name || "", description || "", price, productId)
    .run();

  return json({ ok: true });
}

async function staffDeleteProduct(request, env) {
  const body = await request.json();
  const { productId } = body;

  if (!productId) return json({ error: "Missing productId" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_products SET active = 0 WHERE id = ?"
  )
    .bind(productId)
    .run();

  return json({ ok: true });
}

async function staffOrders(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT id FROM network_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!profile) return json({ error: "Profile not found" }, 404);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE ownerId = ? ORDER BY createdAt DESC"
  )
    .bind(profile.id)
    .all();

  return json(results);
}

async function staffPayouts(url, env) {
  const email = url.searchParams.get("email");
  if (!email) return json({ error: "Missing email" }, 400);

  const profile = await env.DB_network.prepare(
    "SELECT id FROM network_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!profile) return json({ error: "Profile not found" }, 404);

  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_payouts WHERE ownerId = ? ORDER BY createdAt DESC"
  )
    .bind(profile.id)
    .all();

  return json(results);
}

// NETWORK PAY (with delivery + driver payouts)
async function networkPay(request, env) {
  const body = await request.json();
  const {
    productId,
    buyerName,
    buyerEmail,
    deliveryMethod,
    deliveryLocation,
    dropSpotId,
    driverId,
    tipAmount
  } = body;

  if (!productId || !buyerName || !buyerEmail)
    return json({ error: "Missing fields" }, 400);

  const product = await env.DB_network.prepare(
    "SELECT * FROM network_products WHERE id = ? AND active = 1"
  )
    .bind(productId)
    .first();

  if (!product) return json({ error: "Product not found" }, 404);

  const owner = await env.DB_network.prepare(
    "SELECT * FROM network_profiles WHERE id = ?"
  )
    .bind(product.ownerId)
    .first();

  if (!owner || owner.isBlocked) return json({ error: "Seller unavailable" }, 403);

  const now = new Date();
  let commission = owner.commissionPercent || 0.15;

  if (owner.freeSalesEnabled && owner.freeSalesUntil) {
    const until = new Date(owner.freeSalesUntil);
    if (now <= until) commission = 0;
  }

  const price = product.price;
  const tip = tipAmount || 0;
  const deliveryFee =
    deliveryMethod === "fastroll" || deliveryMethod === "meet" ? 5 : 0;

  const gross = price + tip + deliveryFee;
  const platformCut = gross * commission;
  const ownerCut = price - platformCut;
  const driverCut =
    deliveryMethod === "fastroll" || deliveryMethod === "meet"
      ? deliveryFee + tip
      : 0;

  const token = await paypalToken(env);

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: gross.toString() },
          description: `Network purchase — ${product.name}`
        }
      ],
      application_context: {
        return_url: `${env.SITE_URL}/network/public/pages/index.html?paypal=return`,
        cancel_url: `${env.SITE_URL}/network/public/pages/index.html?paypal=cancel`
      }
    })
  });

  const order = await orderRes.json();

  const orderId = crypto.randomUUID();
  await env.DB_network.prepare(
    `INSERT INTO network_orders
     (id, productId, ownerId, buyerName, buyerEmail, deliveryMethod, deliveryLocation, dropSpotId,
      price, tipAmount, deliveryFee, platformCut, ownerCut, driverCut,
      driverId, paypalOrderId, paymentStatus, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
  )
    .bind(
      orderId,
      productId,
      owner.id,
      buyerName,
      buyerEmail,
      deliveryMethod || "none",
      deliveryLocation || "",
      dropSpotId || null,
      price,
      tip,
      deliveryFee,
      platformCut,
      ownerCut,
      driverCut,
      driverId || null,
      order.id
    )
    .run();

  const approveLink = order.links.find(l => l.rel === "approve")?.href;
  return json({ approveUrl: approveLink });
}

async function networkCapture(request, env) {
  const { orderId } = await request.json();
  if (!orderId) return json({ error: "Missing orderId" }, 400);

  const token = await paypalToken(env);

  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const data = await res.json();
  if (data.status !== "COMPLETED")
    return json({ error: "Payment not completed" }, 400);

  const order = await env.DB_network.prepare(
    "SELECT * FROM network_orders WHERE paypalOrderId = ?"
  )
    .bind(orderId)
    .first();

  if (!order) return json({ error: "Order not found" }, 404);

  await env.DB_network.prepare(
    "UPDATE network_orders SET paymentStatus = 'paid' WHERE id = ?"
  )
    .bind(order.id)
    .run();

  // Vendor payout
  await env.DB_network.prepare(
    `INSERT INTO network_payouts
     (id, ownerId, orderId, amount, status, createdAt)
     VALUES (?, ?, ?, ?, 'unpaid', datetime('now'))`
  )
    .bind(crypto.randomUUID(), order.ownerId, order.id, order.ownerCut)
    .run();

  // Driver payout (if delivery)
  if (order.driverId && order.driverCut > 0) {
    await env.DB_network.prepare(
      `INSERT INTO driver_payouts
       (id, driverId, orderId, amount, status, createdAt)
       VALUES (?, ?, ?, ?, 'unpaid', datetime('now'))`
    )
      .bind(crypto.randomUUID(), order.driverId, order.id, order.driverCut)
      .run();
  }

  await notifyEvent("network_purchase", order.buyerEmail, order, env);

  if (order.deliveryMethod === "meet" || order.deliveryMethod === "fastroll") {
    await notifyEvent("delivery_instructions", order.buyerEmail, order, env);
  }

  return json({ success: true });
}

// ADMIN NETWORK
async function adminListProfiles(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_profiles ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function adminListProducts(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT * FROM network_products ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function adminBlockProfile(request, env) {
  const { profileId, blocked } = await request.json();
  if (!profileId) return json({ error: "Missing profileId" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_profiles SET isBlocked = ? WHERE id = ?"
  )
    .bind(blocked ? 1 : 0, profileId)
    .run();

  return json({ ok: true });
}

async function adminSetCommission(request, env) {
  const { profileId, commissionPercent } = await request.json();
  if (!profileId || commissionPercent == null)
    return json({ error: "Missing fields" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_profiles SET commissionPercent = ? WHERE id = ?"
  )
    .bind(commissionPercent, profileId)
    .run();

  return json({ ok: true });
}

async function adminSetFreeWindow(request, env) {
  const { profileId, enabled, until } = await request.json();
  if (!profileId) return json({ error: "Missing profileId" }, 400);

  await env.DB_network.prepare(
    "UPDATE network_profiles SET freeSalesEnabled = ?, freeSalesUntil = ? WHERE id = ?"
  )
    .bind(enabled ? 1 : 0, until || null, profileId)
    .run();

  return json({ ok: true });
}

async function adminAnalytics(env) {
  const total = await env.DB_network.prepare(
    "SELECT COUNT(*) AS orders, SUM(price + tipAmount + deliveryFee) AS gross, SUM(platformCut) AS platform, SUM(ownerCut) AS owners, SUM(driverCut) AS drivers FROM network_orders WHERE paymentStatus = 'paid'"
  ).first();

  const { results: perProfile } = await env.DB_network.prepare(
    `SELECT np.id, np.name,
            COUNT(no.id) AS orders,
            SUM(no.price + no.tipAmount + no.deliveryFee) AS gross,
            SUM(no.platformCut) AS platform,
            SUM(no.ownerCut) AS owners,
            SUM(no.driverCut) AS drivers
     FROM network_orders no
     JOIN network_profiles np ON np.id = no.ownerId
     WHERE no.paymentStatus = 'paid'
     GROUP BY np.id`
  ).all();

  return json({ total, perProfile });
}

/* ========= NEW NETWORK FEEDS ========= */

async function listVendors(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, name, bio, photoUrl, tags, categories FROM vendors WHERE active = 1 ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function listServices(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, vendorId, name, description, price, duration, photoUrl, featured FROM services ORDER BY featured DESC, createdAt DESC"
  ).all();
  return json(results);
}

async function listProducts(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, vendorId, name, description, price, photoUrl, stock FROM products ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function listExplore(env) {
  const { results } = await env.DB_network.prepare(
    "SELECT id, title, body AS description, photoUrl, createdAt FROM explore_posts ORDER BY createdAt DESC"
  ).all();
  return json(results);
}

async function getVendorFull(url, env) {
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const vendor = await env.DB_network.prepare(
    "SELECT * FROM vendors WHERE id = ? AND active = 1"
  )
    .bind(id)
    .first();

  if (!vendor) return json({ error: "Vendor not found" }, 404);

  const { results: products } = await env.DB_network.prepare(
    "SELECT * FROM products WHERE vendorId = ? ORDER BY createdAt DESC"
  )
    .bind(id)
    .all();

  const { results: workshops } = await env.DB_network.prepare(
    "SELECT * FROM workshops WHERE vendorId = ? ORDER BY createdAt DESC"
  )
    .bind(id)
    .all();

  const { results: services } = await env.DB_network.prepare(
    "SELECT * FROM services WHERE vendorId = ? ORDER BY createdAt DESC"
  )
    .bind(id)
    .all();

  return json({ vendor, products, workshops, services });
}

async function listWorkshops(env) {
  const { results } = await env.DB_network.prepare(
    `SELECT w.id, w.title, w.description, w.schedule, w.price,
            v.name AS hostName
     FROM workshops w
     LEFT JOIN vendors v ON v.id = w.vendorId
     ORDER BY w.createdAt DESC`
  ).all();
  return json(results);
}
