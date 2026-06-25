CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  title TEXT,
  description TEXT,
  price REAL,
  schedule TEXT,
  photoUrl TEXT,
  createdAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
