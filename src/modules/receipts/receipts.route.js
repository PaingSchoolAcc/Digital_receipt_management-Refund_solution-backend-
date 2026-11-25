import {Router} from 'express';

import {
    createReceipt,
    getAllReceipts,
    getReceiptById,

} from './receipts.controller.js';

const router = Router();
// Create a new receipt
router.post('/',createReceipt);

// Get all receipts
router.get('/all/:id', getAllReceipts);

// Get a specific receipt by ID
router.get('/:id', getReceiptById);



export default router;