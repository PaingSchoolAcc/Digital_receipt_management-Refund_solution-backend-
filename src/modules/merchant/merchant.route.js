import { Router } from 'express';
import {
  getCashiersByStatus,
  updateCashierStatus,
  getActiveApprovalCodes,
  createApprovalCode,
} from './merchant.controller.js';

const router = Router();

// Static approval-code routes first so Express never treats 'approval-codes' as ':status'
router.get('/approval-codes/active', getActiveApprovalCodes);
router.post('/approval-codes', createApprovalCode);

// Dynamic cashier routes after static routes
router.get('/:status', getCashiersByStatus);
router.post('/:id/:decision', updateCashierStatus);

export default router;