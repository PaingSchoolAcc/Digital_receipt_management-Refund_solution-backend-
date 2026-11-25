import { Router } from 'express';
import {
  getRefundsByMerchantId,
  updateRefundStatus,
} from './refund.controller.js';

const router = Router();

// Get all refund rows for a given merchant_id
router.get('/:id', getRefundsByMerchantId);

// Approve or reject refund by receipt_id and sync both tables
router.post('/:id/:decision', updateRefundStatus);

export default router;