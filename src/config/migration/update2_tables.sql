CREATE OR REPLACE FUNCTION set_refund_customer_id()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id INT;
BEGIN
  SELECT customer_id
  INTO v_customer_id
  FROM receipts
  WHERE receipt_id = NEW.receipt_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % does not exist', NEW.receipt_id;
  END IF;

  -- Populate from receipt if not explicitly supplied
  IF NEW.customer_id IS NULL THEN
    NEW.customer_id := v_customer_id;
  ELSIF NEW.customer_id <> v_customer_id THEN
    RAISE EXCEPTION 'customer_id % does not match receipt % customer_id %',
      NEW.customer_id, NEW.receipt_id, v_customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_refund_customer_id ON refunds;

CREATE TRIGGER trg_set_refund_customer_id
BEFORE INSERT ON refunds
FOR EACH ROW
EXECUTE FUNCTION set_refund_customer_id();