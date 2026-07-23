const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/products - public list of all products with stock
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY category, name');
    res.json({ products, discountRate: Number(process.env.DISCOUNT_RATE || 0.15) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

// GET /api/products/:id - single product
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load product.' });
  }
});

module.exports = router;
