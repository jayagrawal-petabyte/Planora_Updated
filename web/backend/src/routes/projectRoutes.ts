import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectActivity
} from '../controllers/projectController';
import { authenticateUser, requireRole } from '../middleware/authMiddleware';

const router = Router();

// All project routes require authentication
router.use(authenticateUser);

router.get('/', getProjects);
router.get('/:id/activity', getProjectActivity);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);


export default router;
