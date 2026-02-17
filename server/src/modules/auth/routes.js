import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import store from '../../config/mockStore.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'obs3rv4b1l1ty-s3cr3t-k3y-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required', code: 'VALIDATION_ERROR' });
        }

        const user = store.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        // For demo: accept "password123" for all mock users
        const isValidPassword = password === 'password123' || await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Log the login
        store.addAuditLog({
            action: 'USER_LOGIN',
            details: `User ${user.name} logged in`,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            ipAddress: req.ip,
        });

        res.json({
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role },
            expiresIn: JWT_EXPIRES_IN,
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, (req, res) => {
    const user = store.findUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    }
    res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authenticate, (req, res) => {
    const token = jwt.sign(
        { id: req.user.id, email: req.user.email, role: req.user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({ token, expiresIn: JWT_EXPIRES_IN });
});

export default router;
