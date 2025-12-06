import { supabase } from '../config/supabase.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing authentication token.' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        const role = user.user_metadata.role;
        if (role !== 'customer') {
            console.warn(`Unauthorized access attempt by user ID ${user.id} with role: ${role}`);
            return res.status(403).json({ error: 'Access denied. Only customers can access this endpoint.' });
        }
        req.user = user;
        req.user.role = role;

        next();
    } catch (err) {
        console.error('Auth Check Failed:', err);
        res.status(500).json({ error: 'Authentication check failed due to a server issue.' });
    }
};

export default authMiddleware;