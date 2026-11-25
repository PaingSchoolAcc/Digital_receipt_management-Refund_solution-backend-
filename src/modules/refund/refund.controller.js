import pool from '../../config/database.js';
const REFUND_COLUMNS = `
  rf.refund_id,
  rf.receipt_id,
  rf.customer_id,
  r.merchant_id,
  rf.requested_at,
  rf.refund_status,
  rf.refund_amount,
  rf.refund_reason,
  rf.processed_at
`;

// GET /api/refunds/:id
export async function getRefundsByMerchantId(req, res, next) {
  try {
    const merchantId = Number(req.params.id);

    if (!Number.isInteger(merchantId) || merchantId <= 0) {
      return res.status(400).json({ error: 'Invalid merchant ID' });
    }

    const result = await pool.query(
      `SELECT ${REFUND_COLUMNS}
       FROM refunds rf
       JOIN receipts r ON rf.receipt_id = r.receipt_id
       WHERE r.merchant_id = $1
       ORDER BY rf.requested_at DESC, rf.refund_id DESC`,
      [merchantId]
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}
// POST /api/refunds/:id/:decision  (where :id = receipt_id, :decision = true | false)
export async function updateRefundStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const receiptId = Number(req.params.id);
    const rawDecision = String(req.params.decision).toLowerCase();

    if (!Number.isInteger(receiptId) || receiptId <= 0) {
      return res.status(400).json({ error: 'Valid receipt id is required' });
    }

    if (rawDecision !== 'true' && rawDecision !== 'false') {
      return res.status(400).json({
        error: "Invalid decision parameter. Expected 'true' (approve) or 'false' (reject)",
      });
    }

    const isApproved = rawDecision === 'true';
    const nextRefundStatus = isApproved ? 'approved' : 'rejected';
    const nextReceiptStatus = isApproved ? 'refunded' : 'refund_rejected';

    await client.query('BEGIN');

    const refundResult = await client.query(
      `UPDATE refunds
       SET refund_status = $1::refund_status,
           processed_at = CURRENT_TIMESTAMP
       WHERE receipt_id = $2
       RETURNING *`,
      [nextRefundStatus, receiptId]
    );

    if (refundResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res
        .status(404)
        .json({ error: 'No refund found for the given receipt_id' });
    }

    const receiptResult = await client.query(
      `UPDATE receipts
       SET receipt_status = $1::receipt_status
       WHERE receipt_id = $2
       RETURNING *`,
      [nextReceiptStatus, receiptId]
    );

    if (receiptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Receipt not found' });
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: `Refund ${nextRefundStatus} and receipt updated to ${nextReceiptStatus}`,
      data: {
        refunds: refundResult.rows,
        receipt: receiptResult.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}