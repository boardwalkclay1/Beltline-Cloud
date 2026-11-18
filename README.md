# Beltline Cloud

The site runs as a Cloudflare Worker with static assets in `public/` and a D1 database.
The Network's public vendor, product, service, workshop, and explore feeds use the
tables in `migrations/`. They will be empty until data is added.

## Local development

With Node.js and Wrangler installed, run:

```sh
npx wrangler d1 migrations apply network --local
npx wrangler dev
```

Open the URL printed by Wrangler. To run the Worker routing tests, use
`node --test tests/worker.test.mjs`.

## Deployment

Use a Cloudflare account with a D1 database, replace the `database_id` in
`wrangler.toml` if the configured database is not yours, and review the target
database and migration history before running:

```sh
npx wrangler d1 migrations apply network --remote
npx wrangler deploy
```

This deploys a Worker and its assets, not a Cloudflare Pages project. Configure
the desired custom domain or route in Cloudflare. Do not apply migrations to an
existing database without checking compatibility and taking a backup first.

## Features not ready for production

Account signup/login, staff and admin portals, booking, checkout, payouts and
delivery are unfinished. Their API routes return 503 deliberately: the legacy
code uses tables or columns absent from the migrations and staff routes lack
authentication. Payment capture and booking also need concurrency, idempotency
and error handling before they can safely be enabled. Existing legacy code is
retained for reference, not as an operational payment system. Implement and
test those flows before accepting customer data or payments; PayPal credentials,
an email provider, and an intended deployment domain will also be needed.
