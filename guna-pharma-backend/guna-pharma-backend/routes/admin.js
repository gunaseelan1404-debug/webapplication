const express = require('express');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/orders - all orders with customer & item details
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, c.first_name, c.last_name, c.email, c.mobile, c.customer_id AS customer_code
      FROM orders o JOIN customers c ON c.id = o.customer_id
      ORDER BY o.id DESC
    `);
    const withItems = await Promise.all(orders.map(async (o) => {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return { ...o, items };
    }));
    res.json({ orders: withItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

// PATCH /api/admin/orders/:id  { status }
router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Payment Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update order status.' });
  }
});

// GET /api/admin/customers - all registered customers (no password hashes)
router.get('/customers', async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT id, customer_id, first_name, last_name, email, mobile, city, state, created_at
      FROM customers ORDER BY id DESC
    `);
    res.json({ customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load customers.' });
  }
});

module.exports = router;
