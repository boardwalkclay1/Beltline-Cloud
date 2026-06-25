CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  name TEXT,
  description TEXT,
  price REAL,
  photoUrl TEXT,
  stock INTEGER,
  createdAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
