CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  bookingId TEXT,
  amount REAL,
  status TEXT,
  createdAt TEXT,
  paidAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  FOREIGN KEY (bookingId) REFERENCES bookings(id)
);
