import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { generateToken, generateRefreshToken, AuthRequest, authenticateToken } from '../middleware/auth';
import { loginValidation, registerValidation, validate } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimit';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      const { rows } = await query(
        'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
        [username]
      );

      if (rows.length === 0) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = rows[0];

      if (!user.is_active) {
        res.status(403).json({ error: 'Account is disabled' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({ id: user.id });

      // Store refresh token hash
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshTokenHash, expiresAt]
      );

      res.json({
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /auth/register
router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const { rows: existing } = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existing.length > 0) {
        res.status(409).json({ error: 'Username or email already exists' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { rows } = await query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, 'analyst')
         RETURNING id, username, email, role`,
        [username, email, passwordHash]
      );

      const user = rows[0];
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Find valid refresh tokens
    const { rows: tokens } = await query(
      `SELECT rt.*, u.username, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.expires_at > NOW()`,
      []
    );

    let validToken = null;
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token_hash);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    if (!validToken.is_active) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }

    // Generate new access token
    const newToken = generateToken({
      id: validToken.user_id,
      username: validToken.username,
      role: validToken.role,
    });

    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /auth/logout
router.post(
  '/logout',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Delete all refresh tokens for this user
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user?.id]);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
);

// GET /auth/me
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { rows } = await query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
        [req.user?.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: rows[0] });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }
);

export default router;
