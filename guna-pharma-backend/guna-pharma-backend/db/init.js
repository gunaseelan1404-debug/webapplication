const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'guna_pharma.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------- TABLES ----------------
db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  gender TEXT NOT NULL,
  dob TEXT NOT NULL,
  shop_name TEXT,
  house_street TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT NOT NULL,
  subscribe INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_emoji TEXT DEFAULT '💊'
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  subtotal REAL NOT NULL,
  discount_rate REAL NOT NULL,
  discount_amount REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'GPay',
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'Payment Pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL
);
`);

// ---------------- SEED PRODUCTS (only if empty) ----------------
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, description, unit, price, stock, image_emoji)
    VALUES (@name, @category, @description, @unit, @price, @stock, @image_emoji)
  `);
  const sample = [
    { name: 'Paracetamol 500mg', category: 'Pain Relief', description: 'Fever & pain relief tablets', unit: 'Strip of 10', price: 25, stock: 200, image_emoji: '💊' },
    { name: 'Vitamin C 500mg', category: 'Vitamins & Supplements', description: 'Immunity support chewable tablets', unit: 'Bottle of 30', price: 180, stock: 120, image_emoji: '🍊' },
    { name: 'Cough Syrup', category: 'Cold & Cough', description: 'Relief from dry & wet cough', unit: '100 ml bottle', price: 95, stock: 80, image_emoji: '🧴' },
    { name: 'ORS Powder', category: 'Hydration', description: 'Oral rehydration salts sachet', unit: 'Pack of 5', price: 45, stock: 150, image_emoji: '🥤' },
    { name: 'Antiseptic Liquid', category: 'First Aid', description: 'Wound cleaning antiseptic solution', unit: '200 ml bottle', price: 110, stock: 90, image_emoji: '🩹' },
    { name: 'Digital Thermometer', category: 'Devices', description: 'Fast & accurate temperature reading', unit: '1 unit', price: 250, stock: 40, image_emoji: '🌡️' },
    { name: 'Hand Sanitizer', category: 'Hygiene', description: '70% alcohol based sanitizer', unit: '500 ml bottle', price: 130, stock: 100, image_emoji: '🧼' },
    { name: 'N95 Face Mask', category: 'Protection', description: '5-layer protective mask', unit: 'Pack of 5', price: 199, stock: 160, image_emoji: '😷' },
    { name: 'Blood Pressure Monitor', category: 'Devices', description: 'Digital BP monitoring machine', unit: '1 unit', price: 1450, stock: 25, image_emoji: '🩺' },
    { name: 'Multivitamin Tablets', category: 'Vitamins & Supplements', description: 'Daily essential multivitamins', unit: 'Bottle of 60', price: 320, stock: 70, image_emoji: '🧪' },
    { name: 'Calcium + D3 Tablets', category: 'Vitamins & Supplements', description: 'Bone health support tablets', unit: 'Bottle of 30', price: 210, stock: 60, image_emoji: '🦴' },
    { name: 'Adhesive Bandage Strips', category: 'First Aid', description: 'Waterproof wound plasters', unit: 'Box of 40', price: 60, stock: 140, image_emoji: '🩹' },
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  insertMany(sample);
  console.log(`Seeded ${sample.length} sample products.`);
}

module.exports = db;
