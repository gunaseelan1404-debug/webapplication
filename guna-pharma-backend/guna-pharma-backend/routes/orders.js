const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function generateOrderId() {
  const d = new Date();
  const datePart =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const randPart = Math.floor(10000 + Math.random() * 90000);
  return 'GPO' + datePart + randPart;
}

// POST /api/orders/checkout  { paymentReference? }
router.post('/checkout', async (req, res) => {
  const { paymentReference } = req.body;
  const customerDbId = req.customer.id;

  const connection = await pool.getConnection();
  try {
    const [cartItems] = await connection.query(`
      SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
      FROM cart_items ci JOIN products p ON p.id = ci.product_id
      WHERE ci.customer_id = ?
    `, [customerDbId]);

    if (cartItems.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        connection.release();
        return res.status(400).json({ error: `${item.name} only has ${item.stock} unit(s) left in stock.` });
      }
    }

    const discountRate = Number(process.env.DISCOUNT_RATE || 0.15);
    const subtotal = cartItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
    const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
    const orderId = generateOrderId();
    const createdAt = new Date();

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_id, customer_id, subtotal, discount_rate, discount_amount, total_amount,
                            payment_method, payment_reference, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'GPay', ?, 'Payment Pending', ?)`,
      [orderId, customerDbId, subtotal, discountRate, discountAmount, totalAmount,
        (paymentReference || '').trim() || null, createdAt]
    );
    const newOrderDbId = orderResult.insertId;

    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [newOrderDbId, item.product_id, item.name, item.quantity, item.price]
      );
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.query('DELETE FROM cart_items WHERE customer_id = ?', [customerDbId]);

    await connection.commit();

    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ?', [newOrderDbId]);
    const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [newOrderDbId]);

    res.status(201).json({
      message: 'Order placed successfully. Please complete payment via GPay to confirm.',
      order: orderRows[0],
      items,
      gpayNumber: process.env.GPAY_NUMBER || '8148331184'
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Could not place your order. Please try again.' });
  } finally {
    connection.release();
  }
});

// GET /api/orders - order history for the logged-in customer
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC',
      [req.customer.id]
    );
    const withItems = await Promise.all(orders.map(async (o) => {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return { ...o, items };
    }));
    res.json({ orders: withItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your orders.' });
  }
});

module.exports = router;
