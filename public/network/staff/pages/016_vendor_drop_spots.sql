CREATE TABLE vendor_drop_spots (
  id TEXT PRIMARY KEY,
  vendorId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lat REAL,
  lng REAL,
  address TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);
