CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  userId TEXT,
  itemType TEXT, -- vendor | product | service | workshop
  itemId TEXT,
  createdAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);
