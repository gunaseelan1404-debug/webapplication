const pool = require('./pool');

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id VARCHAR(20) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      mobile VARCHAR(10) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      dob DATE NOT NULL,
      shop_name VARCHAR(150) NULL,
      house_street VARCHAR(255) NOT NULL,
      area VARCHAR(150) NOT NULL,
      city VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(6) NOT NULL,
      country VARCHAR(100) NOT NULL,
      subscribe TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description VARCHAR(255) NULL,
      unit VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      image_emoji VARCHAR(10) DEFAULT '💊'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      UNIQUE KEY uniq_customer_product (customer_id, product_id),
      CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(30) UNIQUE NOT NULL,
      customer_id INT NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      discount_rate DECIMAL(5,3) NOT NULL,
      discount_amount DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(30) NOT NULL DEFAULT 'GPay',
      payment_reference VARCHAR(100) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Payment Pending',
      created_at DATETIME NOT NULL,
      CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(150) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM products');
  if (rows[0].c === 0) {
    const sample = [
      ['Paracetamol 500mg', 'Pain Relief', 'Fever & pain relief tablets', 'Strip of 10', 25, 200, '💊'],
      ['Vitamin C 500mg', 'Vitamins & Supplements', 'Immunity support chewable tablets', 'Bottle of 30', 180, 120, '🍊'],
      ['Cough Syrup', 'Cold & Cough', 'Relief from dry & wet cough', '100 ml bottle', 95, 80, '🧴'],
      ['ORS Powder', 'Hydration', 'Oral rehydration salts sachet', 'Pack of 5', 45, 150, '🥤'],
      ['Antiseptic Liquid', 'First Aid', 'Wound cleaning antiseptic solution', '200 ml bottle', 110, 90, '🩹'],
      ['Digital Thermometer', 'Devices', 'Fast & accurate temperature reading', '1 unit', 250, 40, '🌡️'],
      ['Hand Sanitizer', 'Hygiene', '70% alcohol based sanitizer', '500 ml bottle', 130, 100, '🧼'],
      ['N95 Face Mask', 'Protection', '5-layer protective mask', 'Pack of 5', 199, 160, '😷'],
      ['Blood Pressure Monitor', 'Devices', 'Digital BP monitoring machine', '1 unit', 1450, 25, '🩺'],
      ['Multivitamin Tablets', 'Vitamins & Supplements', 'Daily essential multivitamins', 'Bottle of 60', 320, 70, '🧪'],
      ['Calcium + D3 Tablets', 'Vitamins & Supplements', 'Bone health support tablets', 'Bottle of 30', 210, 60, '🦴'],
      ['Adhesive Bandage Strips', 'First Aid', 'Waterproof wound plasters', 'Box of 40', 60, 140, '🩹']
    ];
    await pool.query(
      `INSERT INTO products (name, category, description, unit, price, stock, image_emoji) VALUES ?`,
      [sample]
    );
    console.log(`Seeded ${sample.length} sample products.`);
  }

  console.log('MySQL tables ready.');
}

module.exports = initDb;
