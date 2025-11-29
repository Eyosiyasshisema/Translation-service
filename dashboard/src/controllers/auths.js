import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js'; 

export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password, role = 'company', languagesSupported, rates } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password required' });
    }
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.length) {
      await client.query('ROLLBACK'); 
      return res.status(409).json({ error: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hash, role] 
    );
    const newUser = userResult.rows[0];
    const companyResult = await client.query(
      `INSERT INTO companies (user_id, business_name, languages_supported, rates) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, languages_supported, rates`,
      [
        newUser.id, 
        name, 
        JSON.stringify(languagesSupported || []), 
        JSON.stringify(rates || {})
      ]
    );
    await client.query('COMMIT');
    const fullUser = {
      ...newUser,
      companyProfile: companyResult.rows[0]
    };

    res.status(201).json({ user: fullUser });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    if (user.role !== 'company' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only companies can login here.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.DASHBOARD_JWTSECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
};