CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  request_id TEXT UNIQUE NOT NULL,
  external_reference TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  offer_code TEXT NOT NULL,
  additional_items_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  mp_order_id TEXT UNIQUE,
  mp_checkout_url TEXT,
  mp_status TEXT,
  mp_status_detail TEXT,
  payment_status TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  delivery_response_json TEXT,
  delivery_error_code TEXT,
  mp_create_claimed_at INTEGER,
  delivery_claimed_at INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS orders_mp_order_id ON orders(mp_order_id);
CREATE TABLE IF NOT EXISTS webhook_events (
  notification_id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  action TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  processing_status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_until INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
