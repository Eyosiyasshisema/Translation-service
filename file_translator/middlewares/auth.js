import jwt from 'jsonwebtoken';

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.CUSTOMER_JWTSECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
