
CREATE TABLE IF NOT EXISTS users (
    phone VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    credits INTEGER DEFAULT 0,
    subscription_active BOOLEAN DEFAULT FALSE,
    subscription_plan VARCHAR(255) DEFAULT 'none',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    banned BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_messages INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    order_id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(255) NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(255) REFERENCES users(phone) ON DELETE CASCADE,
    user_name VARCHAR(255),
    command TEXT,
    message TEXT,
    response TEXT,
    type VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

INSERT INTO settings (key, value) VALUES
('botName', 'PeterAi'),
('welcomeMessage', 'Karibu PeterAi! Mimi ni bot yako ya AI yenye nguvu. Tumia /help kuona commands zote zinazopatikana.'),
('aiSystemPrompt', 'Wewe ni PeterAi, msaidizi wa AI anayezungumza Kiswahili na Kiingereza. Jibu kwa ufupi na kwa usahihi. Kuwa wa kirafiki na msaidizi.'),
('creditPrice', '1000'),
('creditsPerPack', '50'),
('subscriptionPrice', '5000'),
('messageCreditCost', '1'),
('imageCreditCost', '3'),
('premiumGroupId', ''),
('botPhoneNumber', ''),
('currency', 'TZS'),
('maxMessageLength', '4096'),
('aiModel', 'llama-3.3-70b-versatile'),
('baileysConnected', 'false'),
('baileysPhone', ''),
('autoTypingEnabled', 'true'),
('autoReactionEnabled', 'true')
ON CONFLICT (key) DO NOTHING;
