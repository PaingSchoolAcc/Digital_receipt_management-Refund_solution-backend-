import pool from '../../config/database.js';
import crypto from 'node:crypto';
const SAFE_USER_COLUMNS = `
  user_id,
  role,
  name,
  email,
  phone_number,
  merchant_to_work_under,
  business_name,
  business_registration_code,
  account_status,
  created_at
`;

const APPROVAL_CODE_COLUMNS = `
  id,
  approval_code,
  status,
  used_at
`;

function generateRandomSixLetterCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, letters.length);
    code += letters[idx];
  }
  return code;
}

// GET /api/merchants/cashiers/:status  (:status = 'active' | 'pending')
export async function getCashiersByStatus(req, res, next) {
  try {
    const status = String(req.params.status).toLowerCase();
    const allowedStatuses = ['active', 'pending'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Expected 'active' or 'pending'",
      });
    }

    const result = await pool.query(
      `SELECT ${SAFE_USER_COLUMNS}
       FROM users
       WHERE role = 'cashier'::user_role
         AND account_status = $1::account_status
       ORDER BY created_at DESC, user_id DESC`,
      [status]
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/merchants/cashiers/:id/:decision  (:id = user_id, :decision = 'true' | 'false')
export async function updateCashierStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const rawDecision = String(req.params.decision).toLowerCase();

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Valid user_id is required' });
    }

    if (rawDecision !== 'true' && rawDecision !== 'false') {
      return res.status(400).json({
        error: "Invalid decision parameter. Expected 'true' (active) or 'false' (rejected)",
      });
    }

    const nextStatus = rawDecision === 'true' ? 'active' : 'rejected';

    const result = await pool.query(
      `UPDATE users
       SET account_status = $1::account_status
       WHERE user_id = $2
         AND role = 'cashier'::user_role
         AND account_status = 'pending'::account_status
       RETURNING ${SAFE_USER_COLUMNS}`,
      [nextStatus, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Pending cashier not found for the given user_id',
      });
    }

    res.status(200).json({
      message: `Cashier account status updated to ${nextStatus}`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}





// GET /api/merchants/approval-codes/active
export async function getActiveApprovalCodes(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${APPROVAL_CODE_COLUMNS}
       FROM approval_codes
       WHERE status = 'active'::approval_code_status
       ORDER BY id DESC`
    );

    res.status(200).json({
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/merchants/approval-codes
export async function createApprovalCode(req, res, next) {
  try {
    const existingResult = await pool.query(
      `SELECT approval_code FROM approval_codes`
    );
    const existingCodes = new Set(
      existingResult.rows.map((row) => row.approval_code)
    );

    let code = '';
    let attempts = 0;
    const maxAttempts = 50;

    do {
      attempts++;
      if (attempts > maxAttempts) {
        return res.status(500).json({
          error: 'Unable to generate a unique approval code',
        });
      }
      code = generateRandomSixLetterCode();
    } while (existingCodes.has(code));

    const inserted = await pool.query(
      `INSERT INTO approval_codes (approval_code, status, used_at)
       VALUES ($1, 'active'::approval_code_status, NULL)
       RETURNING ${APPROVAL_CODE_COLUMNS}`,
      [code]
    );

    res.status(201).json({
      message: 'Approval code generated successfully',
      data: inserted.rows[0],
    });
  } catch (err) {
    next(err);
  }
}