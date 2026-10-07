const crypto = require('crypto');

// In-memory session store: token -> expiry timestamp (ms)
// Good enough for a small single-admin dashboard. Sessions reset if the
// server restarts, which just means the admin has to log in again.
const sessions = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
  }
  next();
}

module.exports = { createSession, requireAuth };
