import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, logout, savePushToken, refresh } from '../controllers/authController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per `window`
  message: { success: false, error: { message: "Too many requests from this IP, please try again after 15 minutes" } }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);
router.post('/push-token', authenticateUser, savePushToken);
router.post('/refresh', refresh);

export default router;
