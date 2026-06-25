CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vendorId TEXT,
  itemType TEXT, -- service | workshop
  itemId TEXT,
  date TEXT,
  time TEXT,
  notes TEXT,
  price REAL,
  paymentStatus TEXT,
  paypalOrderId TEXT,
  createdAt TEXT,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
