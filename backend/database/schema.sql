-- Military Asset Management System Schema
-- Database: military_asset_management

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenditures CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS bases CASCADE;

-- Bases Table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (password_hash explicitly enforces hashed storage)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    base_id INT REFERENCES bases(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Types Table
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('WEAPON', 'VEHICLE', 'AMMUNITION')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchases Table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Transfers Table
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    source_base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    destination_base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    initiated_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_diff_bases CHECK (source_base_id <> destination_base_id)
);

-- Assignments Table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    assigned_to VARCHAR(150) NOT NULL,
    assignment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenditures Table
CREATE TABLE expenditures (
    id SERIAL PRIMARY KEY,
    base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    expenditure_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    created_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Central Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimized analytical aggregations & lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_purchases_base_equip ON purchases(base_id, equipment_type_id, purchase_date);
CREATE INDEX idx_transfers_source ON transfers(source_base_id, equipment_type_id, transfer_date);
CREATE INDEX idx_transfers_dest ON transfers(destination_base_id, equipment_type_id, transfer_date);
CREATE INDEX idx_assignments_base_equip ON assignments(base_id, equipment_type_id, assignment_date);
CREATE INDEX idx_expenditures_base_equip ON expenditures(base_id, equipment_type_id, expenditure_date);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
