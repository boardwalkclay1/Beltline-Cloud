CREATE TABLE IF NOT EXISTS explore_posts (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  title TEXT,
  body TEXT,
  photoUrl TEXT,
  createdAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
