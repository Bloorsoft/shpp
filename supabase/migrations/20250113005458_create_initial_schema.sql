-- 1) USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id               BIGSERIAL PRIMARY KEY,
  name             VARCHAR(255),
  email            VARCHAR(255) UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) MAIL_ACCOUNTS TABLE
--    Each row is one mailbox (e.g., a Gmail or Outlook account).
--    Storing OAuth tokens or subscription info here.
CREATE TABLE IF NOT EXISTS mail_accounts (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider           VARCHAR(50) NOT NULL,       -- e.g. 'gmail', 'outlook'
  email_address      VARCHAR(255) NOT NULL,      -- actual mailbox address
  
  -- Tokens stored here (could be TEXT or BYTEA). 
  -- Consider encrypting them before insert:
  access_token       TEXT,
  refresh_token      TEXT,
  token_expires_at   TIMESTAMPTZ,

  -- For Gmail Watch API or Outlook subscriptions:
  watch_expiration   TIMESTAMPTZ,
  history_id         VARCHAR(255),              -- e.g. Gmail's historyId

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) THREADS TABLE
--    Each thread is tied to one mail_account.
CREATE TABLE IF NOT EXISTS threads (
  id                 BIGSERIAL PRIMARY KEY,
  mail_account_id    BIGINT NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,

  provider_thread_id VARCHAR(255) NOT NULL,      -- unique ID from Gmail/Outlook
  subject            VARCHAR(1000),              -- optional
  snippet            TEXT,                       -- short snippet or preview
  is_archived        BOOLEAN DEFAULT FALSE,
  is_deleted         BOOLEAN DEFAULT FALSE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) MESSAGES TABLE
--    Individual messages belong to a thread (which belongs to one mail_account).
CREATE TABLE IF NOT EXISTS messages (
  id                  BIGSERIAL PRIMARY KEY,
  thread_id           BIGINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,

  provider_message_id VARCHAR(255) NOT NULL,     -- Gmail messageId, Outlook msgId
  sender              VARCHAR(255),
  recipients          TEXT,                      -- could be CSV or JSON array
  cc                  TEXT,
  bcc                 TEXT,
  sent_at             TIMESTAMPTZ,

  body                TEXT,                      -- store message body/HTML
  is_read             BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) LABELS TABLE
--    Each label/folder is associated with a mail_account.
--    In Gmail, label ID is unique to that mailbox; similarly for Outlook folders.
CREATE TABLE IF NOT EXISTS labels (
  id                  BIGSERIAL PRIMARY KEY,
  mail_account_id     BIGINT NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,

  provider_label_id   VARCHAR(255) NOT NULL,     -- e.g. Gmail's label ID
  name                VARCHAR(255) NOT NULL,
  color               VARCHAR(50),               -- optional: store label color
  label_type          VARCHAR(50),               -- e.g. 'system' or 'user'

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) MESSAGE_LABELS TABLE
--    Many-to-many relationship between messages and labels.
--    (One message can have multiple labels, one label can apply to many messages.)
CREATE TABLE IF NOT EXISTS message_labels (
  message_id  BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  label_id    BIGINT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, label_id)
);

-- Optional: Indexes for performance
-- provider_message_id or provider_thread_id might be a good index for quick lookups.
CREATE INDEX IF NOT EXISTS idx_threads_provider_thread
  ON threads (provider_thread_id);

CREATE INDEX IF NOT EXISTS idx_messages_provider_msg
  ON messages (provider_message_id);

CREATE INDEX IF NOT EXISTS idx_labels_provider_label
  ON labels (provider_label_id);