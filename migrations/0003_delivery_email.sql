ALTER TABLE orders ADD COLUMN delivery_email_status TEXT NOT NULL DEFAULT 'not_ready';
ALTER TABLE orders ADD COLUMN delivery_email_claim_token TEXT;
ALTER TABLE orders ADD COLUMN delivery_email_claimed_at INTEGER;
ALTER TABLE orders ADD COLUMN delivery_email_sent_at TEXT;
