import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js'; 

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = 'customer'; 

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password required' });
    }

    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hash, role]
    );
    const user = rows[0];

    res.status(201).json({ user });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    let companyProfile = null;
    if (user.role === 'company') {
      const { rows: companyRows } = await pool.query(
        'SELECT id, business_name, languages_supported, rates, is_verified FROM companies WHERE user_id = $1',
        [user.id]
      );
      companyProfile = companyRows[0] || null;
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.CUSTOMER_JWTSECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyProfile: companyProfile, 
      },
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;