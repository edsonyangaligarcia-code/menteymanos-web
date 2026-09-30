ALTER TABLE orders ADD COLUMN delivery_claim_token TEXT;
ALTER TABLE orders ADD COLUMN reconcile_claim_token TEXT;
ALTER TABLE orders ADD COLUMN reconcile_claimed_at INTEGER;
ALTER TABLE orders ADD COLUMN last_reconcile_attempt_at INTEGER;
