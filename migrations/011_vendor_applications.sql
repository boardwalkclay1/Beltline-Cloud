CREATE TABLE IF NOT EXISTS vendor_applications (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  categories TEXT,
  description TEXT,
  photoUrl TEXT,
  status TEXT, -- pending | approved | rejected
  createdAt TEXT
);
