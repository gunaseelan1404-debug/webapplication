const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function getCart(customerDbId) {
  const [rows] = await pool.query(`
    SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.unit,
           p.price, p.stock, p.image_emoji
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = ?
    ORDER BY ci.id
  `, [customerDbId]);
  return rows;
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const items = await getCart(req.customer.id);
    res.json({ items, discountRate: Number(process.env.DISCOUNT_RATE || 0.15) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load your cart.' });
  }
});

// POST /api/cart  { productId, quantity }
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const [productRows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    const product = productRows[0];
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.stock < 1) return res.status(400).json({ error: 'This product is out of stock.' });

    const [existingRows] = await pool.query(
      'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?',
      [req.customer.id, productId]
    );
    const existing = existingRows[0];

    if (existing) {
      const newQty = Math.min(existing.quantity + qty, product.stock);
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      const newQty = Math.min(qty, product.stock);
      await pool.query(
        'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.customer.id, productId, newQty]
      );
    }

    res.json({ items: await getCart(req.customer.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add item to cart.' });
  }
});

// PATCH /api/cart/:cartItemId  { quantity }
router.patch('/:cartItemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const [itemRows] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ? AND customer_id = ?',
      [req.params.cartItemId, req.customer.id]
    );
    const item = itemRows[0];
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });

    if (qty < 1) {
      await pool.query('DELETE FROM cart_items WHERE id = ?', [item.id]);
    } else {
      const [productRows] = await pool.query('SELECT stock FROM products WHERE id = ?', [item.product_id]);
      const stock = productRows[0].stock;
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [Math.min(qty, stock), item.id]);
    }
    res.json({ items: await getCart(req.customer.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update cart.' });
  }
});

// DELETE /api/cart/:cartItemId
router.delete('/:cartItemId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND customer_id = ?',
      [req.params.cartItemId, req.customer.id]
    );
    res.json({ items: await getCart(req.customer.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove item.' });
  }
});

module.exports = router;
