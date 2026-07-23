const express = require('express');
const db = require('../db/init');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/orders - all orders with customer & item details
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, c.first_name, c.last_name, c.email, c.mobile, c.customer_id AS customer_code
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.id DESC
  `).all();
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json({ orders: withItems });
});

// PATCH /api/admin/orders/:id  { status }
// status: 'Payment Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
router.patch('/orders/:id', (req, res) => {
  const { status } = req.body;
  const allowed = ['Payment Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ order });
});

// GET /api/admin/customers - all registered customers (no password hashes)
router.get('/customers', (req, res) => {
  const customers = db.prepare(`
    SELECT id, customer_id, first_name, last_name, email, mobile, city, state, created_at
    FROM customers ORDER BY id DESC
  `).all();
  res.json({ customers });
});

module.exports = router;
