const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const config = require('../config');
const auth = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas. Inténtalo de nuevo.' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    const token = jwt.sign(
      { sub: user.id, rol: user.rol, email: user.email, institucion_id: user.institucion_id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(sanitizeUser(rows[0]));
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

module.exports = router;
