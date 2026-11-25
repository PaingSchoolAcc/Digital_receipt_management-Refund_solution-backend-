SELECT setval(
  pg_get_serial_sequence('approval_codes', 'id'),
  COALESCE((SELECT MAX(id) FROM approval_codes), 0) + 1,
  false
);