import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getDashboardStats);

export default router;
