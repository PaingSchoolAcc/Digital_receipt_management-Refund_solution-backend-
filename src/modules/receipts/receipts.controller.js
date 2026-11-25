import pool from '../../config/database.js';

const RECEIPT_COLUMNS = `
  receipt_id,
  merchant_id,
  customer_id,
  cashier_id,
  payment_type,
  issued_at,
  items,
  total_amount,
  receipt_status
`;




// POST /api/receipts
export async function createReceipt(req, res, next) {
  try {
    const {
      merchant_id,
      customer_id,
      cashier_id = null,
      payment_type,
      items,
      total_amount,
      receipt_status = 'issued',
    } = req.body;

    if (
      !merchant_id ||
      !customer_id ||
      !payment_type ||
      items === undefined ||
      total_amount === undefined
    ) {
      return res.status(400).json({
        error:
          'merchant_id, customer_id, payment_type, items, and total_amount are required',
      });
    }

    const validStatuses = ['issued', 'viewed', 'refunded'];
    if (!validStatuses.includes(receipt_status)) {
      return res.status(400).json({
        error: `Invalid receipt_status. Expected one of: ${validStatuses.join(', ')}`,
      });
    }

    const normalizedCashierId =
      cashier_id !== null && cashier_id !== undefined && cashier_id !== ''
        ? Number(cashier_id)
        : null;

    if (
      normalizedCashierId !== null &&
      (!Number.isInteger(normalizedCashierId) || normalizedCashierId <= 0)
    ) {
      return res.status(400).json({ error: 'Invalid cashier_id' });
    }

    const result = await pool.query(
      `INSERT INTO receipts (
         merchant_id,
         customer_id,
         cashier_id,
         payment_type,
         items,
         total_amount,
         receipt_status
       )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       RETURNING ${RECEIPT_COLUMNS}`,
      [
        Number(merchant_id),
        Number(customer_id),
        normalizedCashierId,
        payment_type,
        JSON.stringify(items),
        total_amount,
        receipt_status,
      ]
    );

    res.status(201).json({
      message: 'Receipt created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    // Foreign key violation: merchant_id, customer_id, or cashier_id does not exist in users
    if (err.code === '23503') {
      return res.status(400).json({
        error:
          'Invalid merchant_id, customer_id, or cashier_id (referenced user not found)',
      });
    }
    next(err);
  }
}

// GET /api/receipts/user/:id (or matching route)
export async function getAllReceipts(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await pool.query(
      `SELECT ${RECEIPT_COLUMNS}
       FROM receipts
       WHERE merchant_id = $1 OR cashier_id = $1
       ORDER BY issued_at DESC, receipt_id DESC`,
      [userId]
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/receipts/:id
export async function getReceiptById(req, res, next) {
  try {
    const receiptId = Number(req.params.id);

    if (!Number.isInteger(receiptId) || receiptId <= 0) {
      return res.status(400).json({ error: 'Invalid receipt ID' });
    }

    const result = await pool.query(
      `SELECT ${RECEIPT_COLUMNS}
       FROM receipts
       WHERE receipt_id = $1`,
      [receiptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.status(200).json({
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}


