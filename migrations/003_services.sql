CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  name TEXT,
  description TEXT,
  price REAL,
  duration TEXT,
  photoUrl TEXT,
  featured INTEGER, -- 1 = Fast Roll pinned
  createdAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
