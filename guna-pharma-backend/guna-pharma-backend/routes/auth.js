const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const PIN_RE = /^[0-9]{6}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function generateCustomerId() {
  const d = new Date();
  const datePart =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return 'GP' + datePart + randPart;
}

// ---------------- REGISTER ----------------
router.post('/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, mobile, password, confirmPassword,
      gender, dob, shopName, street, area, city, district, state,
      pincode, country, terms, privacy, subscribe
    } = req.body;

    const errors = {};
    if (!firstName || !firstName.trim()) errors.firstName = 'First name is required.';
    if (!lastName || !lastName.trim()) errors.lastName = 'Last name is required.';
    if (!email || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    if (!mobile || !MOBILE_RE.test(mobile)) errors.mobile = 'Mobile number must contain exactly 10 digits.';
    if (!password || !PASSWORD_RE.test(password)) {
      errors.password = 'Min 8 characters incl. uppercase, lowercase, number & special character.';
    }
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!gender) errors.gender = 'Please select a gender.';
    if (!dob) errors.dob = 'Date of birth is required.';
    if (!street || !street.trim()) errors.street = 'House No. / Street is required.';
    if (!area || !area.trim()) errors.area = 'Area / Locality is required.';
    if (!city || !city.trim()) errors.city = 'City is required.';
    if (!district || !district.trim()) errors.district = 'District is required.';
    if (!state || !state.trim()) errors.state = 'State is required.';
    if (!pincode || !PIN_RE.test(pincode)) errors.pincode = 'Pincode must be a 6-digit number.';
    if (!country) errors.country = 'Please select a country.';
    if (!terms) errors.terms = 'You must agree to the Terms & Conditions.';
    if (!privacy) errors.privacy = 'You must agree to the Privacy Policy.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const [existingRows] = await pool.query(
      'SELECT id FROM customers WHERE email = ? OR mobile = ? LIMIT 1',
      [email.trim().toLowerCase(), mobile.trim()]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ errors: { email: 'An account with this email or mobile number already exists.' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const customerId = generateCustomerId();
    const createdAt = new Date();

    const [result] = await pool.query(
      `INSERT INTO customers (
        customer_id, first_name, last_name, email, mobile, password_hash,
        gender, dob, shop_name, house_street, area, city, district, state,
        pincode, country, subscribe, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), mobile.trim(),
        passwordHash, gender, dob, (shopName || '').trim() || null, street.trim(), area.trim(),
        city.trim(), district.trim(), state.trim(), pincode.trim(), country,
        subscribe ? 1 : 0, createdAt
      ]
    );

    const token = jwt.sign(
      { id: result.insertId, customerId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration Successful! Welcome to GUNA PHARMA.',
      token,
      customer: { customerId, firstName, lastName, email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while registering. Please try again.' });
  }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    const customer = rows[0];
    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: customer.id, customerId: customer.customer_id, email: customer.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      customer: {
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong while logging in. Please try again.' });
  }
});

module.exports = router;
