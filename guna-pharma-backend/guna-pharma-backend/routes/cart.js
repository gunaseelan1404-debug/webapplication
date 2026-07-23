const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function getCart(customerDbId) {
  const rows = db.prepare(`
    SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.unit,
           p.price, p.stock, p.image_emoji
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = ?
    ORDER BY ci.id
  `).all(customerDbId);
  return rows;
}

// GET /api/cart
router.get('/', (req, res) => {
  const items = getCart(req.customer.id);
  res.json({ items, discountRate: Number(process.env.DISCOUNT_RATE || 0.15) });
});

// POST /api/cart  { productId, quantity }
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  if (product.stock < 1) return res.status(400).json({ error: 'This product is out of stock.' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?')
    .get(req.customer.id, productId);

  if (existing) {
    const newQty = Math.min(existing.quantity + qty, product.stock);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    const newQty = Math.min(qty, product.stock);
    db.prepare('INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)')
      .run(req.customer.id, productId, newQty);
  }

  res.json({ items: getCart(req.customer.id) });
});

// PATCH /api/cart/:cartItemId  { quantity }
router.patch('/:cartItemId', (req, res) => {
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND customer_id = ?')
    .get(req.params.cartItemId, req.customer.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found.' });

  if (qty < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  } else {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(Math.min(qty, product.stock), item.id);
  }
  res.json({ items: getCart(req.customer.id) });
});

// DELETE /api/cart/:cartItemId
router.delete('/:cartItemId', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND customer_id = ?')
    .run(req.params.cartItemId, req.customer.id);
  res.json({ items: getCart(req.customer.id) });
});

module.exports = router;
