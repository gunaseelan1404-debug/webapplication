require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db/init'); // creates tables + seeds products on first run

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
app.listen(PORT, () => {
  console.log(`GUNA PHARMA API server running at http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Now start the frontend separately (see its README).`);
});
