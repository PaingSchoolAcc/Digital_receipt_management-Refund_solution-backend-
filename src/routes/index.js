
import {Router} from 'express';
import receiptRoutes from '../modules/receipts/receipts.route.js';
import refundRoutes from "../modules/refund/refund.route.js"
import merchantRoutes from "../modules/merchant/merchant.route.js"
const router = Router();

router.use('/receipts', receiptRoutes);
router.use('/refund',refundRoutes)
router.use('/merchant', merchantRoutes)
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend server is running',
        timestamp: new Date().toISOString()
    });
});

export default router;