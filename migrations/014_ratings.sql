CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vendorId TEXT,
  itemType TEXT,
  itemId TEXT,
  rating INTEGER,
  review TEXT,
  createdAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
