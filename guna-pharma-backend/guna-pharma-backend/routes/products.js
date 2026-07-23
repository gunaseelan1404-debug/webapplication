const express = require('express');
const db = require('../db/init');

const router = express.Router();

// GET /api/products - public list of all products with stock
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  res.json({ products, discountRate: Number(process.env.DISCOUNT_RATE || 0.15) });
});

// GET /api/products/:id - single product
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product });
});

module.exports = router;
