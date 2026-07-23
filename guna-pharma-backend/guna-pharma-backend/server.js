require('dotenv').config();
const express = require('express');
const cors = require('cors');

const initDb = require('./db/init');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

// This is an API-only server. The frontend (guna-pharma-frontend) is a
// separate static site hosted on Vercel and calls this server over HTTP.
const allowedOrigins = [
  'https://webapplication-uvvq.vercel.app',
  'http://localhost:5500' // for local frontend testing
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await initDb(); // creates MySQL tables + seeds products on first run
    app.listen(PORT, () => {
      console.log(`GUNA PHARMA API server running at http://localhost:${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to connect to MySQL / start server:', err.message);
    process.exit(1);
  }
}

start();
