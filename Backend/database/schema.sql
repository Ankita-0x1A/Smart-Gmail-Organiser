
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'gmail',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, email_address)
);

CREATE TABLE emails (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email_account_id BIGINT NOT NULL
        REFERENCES email_accounts(id) ON DELETE CASCADE,
    gmail_message_id VARCHAR(255) NOT NULL,
    sender VARCHAR(255),
    subject TEXT,
    body TEXT,
    received_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (email_account_id, gmail_message_id)
);

CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('system', 'custom')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (type = 'system' AND user_id IS NULL)
        OR (type = 'custom' AND user_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX unique_system_category_name
ON categories (LOWER(name))
WHERE type = 'system';

CREATE UNIQUE INDEX unique_custom_category_name_per_user
ON categories (user_id, LOWER(name))
WHERE type = 'custom';

CREATE TABLE email_categories (
    email_id BIGINT NOT NULL
        REFERENCES emails(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,
    assigned_by VARCHAR(20) NOT NULL
        CHECK (assigned_by IN ('ai', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (email_id, category_id)
);

CREATE TABLE reminder_settings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email_id BIGINT NOT NULL UNIQUE
        REFERENCES emails(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    interval_minutes INTEGER NOT NULL DEFAULT 60
        CHECK (interval_minutes > 0),
    next_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
