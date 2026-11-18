CREATE TABLE IF NOT EXISTS delivery_requests (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vendorId TEXT,
  itemId TEXT,
  itemType TEXT, -- product | service
  address TEXT,
  notes TEXT,
  status TEXT,
  createdAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
