-- 1. Add 'cashier' to existing user_role ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cashier';

-- 2. Drop UNIQUE constraint on users.merchant_to_work_under (if it exists)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_merchant_to_work_under_key;

-- 3. Add nullable cashier_id foreign key to receipts
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS cashier_id INT REFERENCES users(user_id);