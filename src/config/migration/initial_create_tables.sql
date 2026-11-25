-- Custom ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'merchant', 'cashier', 'customer');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE receipt_status AS ENUM ('issued', 'refunded','cancelled', "refund_requested", "refund_rejected");
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role user_role NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone_number VARCHAR(30),
  merchant_to_work_under VARCHAR(254) ,
  business_name VARCHAR(150),
  business_registration_code VARCHAR(50),
  account_status account_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Receipts
CREATE TABLE receipts (
  receipt_id SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL REFERENCES users(user_id),
  customer_id INT NOT NULL REFERENCES users(user_id),
  cashier_id INT  REFERENCES users(user_id),
  payment_type VARCHAR(50) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  items JSONB NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  receipt_status receipt_status NOT NULL DEFAULT 'issued'
);

-- 3. Refunds
CREATE TABLE refunds (
  refund_id SERIAL PRIMARY KEY,
  receipt_id INT NOT NULL REFERENCES receipts(receipt_id),
  customer_id INT NOT NULL REFERENCES users(user_id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refund_status refund_status NOT NULL DEFAULT 'pending',
  refund_amount DECIMAL(12, 2) NOT NULL,
  refund_reason TEXT,
  processed_at TIMESTAMPTZ
);

-- 4. Approval Codes
CREATE TABLE approval_codes (
  id SERIAL PRIMARY KEY,
  approval_code VARCHAR(10) NOT NULL
);