CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  passwordHash TEXT,
  photoUrl TEXT,
  createdAt TEXT
);
