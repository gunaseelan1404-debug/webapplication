const mysql = require('mysql2/promise');

// Supports two ways of configuring the connection:
// 1. A single connection string in MYSQL_URL / DATABASE_URL
//    (e.g. mysql://user:pass@host:3306/dbname) - common on Railway/PlanetScale.
// 2. Individual DB_* variables (falls back to Railway's MYSQL* names too).
let pool;

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (connectionString) {
  pool = mysql.createPool(connectionString);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'guna_pharma',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = pool;
