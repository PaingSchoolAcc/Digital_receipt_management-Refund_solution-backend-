ALTER TYPE receipt_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE receipt_status ADD VALUE IF NOT EXISTS 'refund_requested';