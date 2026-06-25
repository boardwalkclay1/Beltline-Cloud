CREATE TABLE IF NOT EXISTS availability (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  itemType TEXT, -- service | workshop
  itemId TEXT,
  date TEXT,
  time TEXT,
  isBooked INTEGER,
  createdAt TEXT,
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);
