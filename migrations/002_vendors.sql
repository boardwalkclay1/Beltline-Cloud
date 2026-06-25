CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  userId TEXT,
  name TEXT,
  bio TEXT,
  photoUrl TEXT,
  tags TEXT,
  categories TEXT,
  active INTEGER,
  paypalEmail TEXT,
  locationSharing INTEGER,
  createdAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);
