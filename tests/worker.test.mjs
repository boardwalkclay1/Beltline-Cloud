import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker.js";

function request(path, method = "GET") {
  return new Request(`https://example.test${path}`, { method });
}

test("serves static paths through the asset binding", async () => {
  const env = { ASSETS: { fetch: async req => new Response(new URL(req.url).pathname) } };
  const response = await worker.fetch(request("/pages/about.html"), env);
  assert.equal(await response.text(), "/pages/about.html");
});

test("unready sensitive routes fail closed, even without configured secrets", async () => {
  for (const [path, method] of [
    ["/api/staff/product/delete", "POST"],
    ["/api/user/bookings?email=someone@example.test", "GET"],
    ["/api/book", "POST"],
    ["/api/network/pay/capture", "POST"],
    ["/api/admin/network/analytics", "GET"]
  ]) {
    const response = await worker.fetch(request(path, method), {});
    assert.equal(response.status, 503, path);
    assert.match((await response.json()).error, /not available/i);
  }
});

test("public feeds query only active vendors and vendor detail excludes private fields", async () => {
  const queries = [];
  const env = {
    DB_network: {
      prepare(sql) {
        queries.push(sql);
        return {
          bind() { return this; },
          async all() { return { results: [] }; },
          async first() { return { id: "v1", name: "Vendor" }; }
        };
      }
    }
  };
  for (const path of ["/api/network/products", "/api/network/services", "/api/network/workshops"]) {
    assert.equal((await worker.fetch(request(path), env)).status, 200);
    assert.match(queries.at(-1), /v\.active = 1/);
  }
  const response = await worker.fetch(request("/api/network/vendor?id=v1"), env);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).vendor, { id: "v1", name: "Vendor" });
  assert.match(queries.at(-4), /SELECT id, name, bio, photoUrl, tags, categories FROM vendors/);
});

test("vendor detail requires an id and rejects missing vendors", async () => {
  assert.equal((await worker.fetch(request("/api/network/vendor"), {})).status, 400);
  const env = { DB_network: { prepare: () => ({ bind() { return this; }, async first() { return null; } }) } };
  assert.equal((await worker.fetch(request("/api/network/vendor?id=missing"), env)).status, 404);
});
