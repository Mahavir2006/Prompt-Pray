import jwt from 'jsonwebtoken';
import store from '../config/mockStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'obs3rv4b1l1ty-s3cr3t-k3y-2024';

// Verify JWT token (supports demo tokens for client-side fallback)
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    try {
        const token = authHeader.split(' ')[1];

        // Handle demo tokens (base64-encoded, prefixed with 'demo_')
        if (token.startsWith('demo_')) {
            try {
                const payload = JSON.parse(atob(token.slice(5)));
                req.user = { id: payload.id, email: payload.email, role: payload.role };
                return next();
            } catch {
                return res.status(401).json({ error: 'Invalid demo token', code: 'INVALID_TOKEN' });
            }
        }

        // Standard JWT verification
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
};

// Role-based access control
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
        }
        next();
    };
};
