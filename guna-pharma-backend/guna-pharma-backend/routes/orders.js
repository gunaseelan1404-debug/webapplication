const express = require('express');
const db = require('../db/init');
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
// Creates the order from whatever is currently in the customer's cart.
router.post('/checkout', (req, res) => {
  const { paymentReference } = req.body;
  const customerDbId = req.customer.id;

  const cartItems = db.prepare(`
    SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = ?
  `).all(customerDbId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `${item.name} only has ${item.stock} unit(s) left in stock.` });
    }
  }

  const discountRate = Number(process.env.DISCOUNT_RATE || 0.15);
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
  const orderId = generateOrderId();
  const createdAt = new Date().toISOString();

  const runCheckout = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (order_id, customer_id, subtotal, discount_rate, discount_amount, total_amount,
                           payment_method, payment_reference, status, created_at)
      VALUES (@order_id, @customer_id, @subtotal, @discount_rate, @discount_amount, @total_amount,
              'GPay', @payment_reference, 'Payment Pending', @created_at)
    `).run({
      order_id: orderId,
      customer_id: customerDbId,
      subtotal,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_reference: (paymentReference || '').trim() || null,
      created_at: createdAt
    });

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderResult.lastInsertRowid, item.product_id, item.name, item.quantity, item.price);
      decrementStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE customer_id = ?').run(customerDbId);

    return orderResult.lastInsertRowid;
  });

  const newOrderDbId = runCheckout();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderDbId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrderDbId);

  res.status(201).json({
    message: 'Order placed successfully. Please complete payment via GPay to confirm.',
    order,
    items,
    gpayNumber: process.env.GPAY_NUMBER || '8148331184'
  });
});

// GET /api/orders - order history for the logged-in customer
router.get('/', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC').all(req.customer.id);
  const withItems = orders.map((o) => ({
    ...o,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
  }));
  res.json({ orders: withItems });
});

module.exports = router;
