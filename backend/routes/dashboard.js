import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/dashboard/summary?companyId=optional
router.get('/summary', auth, getDashboardSummary);

export default router;
