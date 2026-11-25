CREATE TYPE approval_code_status AS ENUM ('active', 'used');

ALTER TABLE approval_codes
  ADD COLUMN IF NOT EXISTS status approval_code_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;