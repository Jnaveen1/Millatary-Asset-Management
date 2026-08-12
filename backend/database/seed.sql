-- Military Asset Management System Seed Data

-- Insert Bases
INSERT INTO bases (id, name, location) VALUES
(1, 'Fort Alpha', 'Sector 1 - Northern District'),
(2, 'Fort Bravo', 'Sector 2 - Eastern Outpost'),
(3, 'Fort Charlie', 'Sector 3 - Southern Command');

SELECT setval('bases_id_seq', (SELECT MAX(id) FROM bases));

-- Insert Equipment Types
INSERT INTO equipment_types (id, name, category, description) VALUES
(1, 'M4 Carbine', 'WEAPON', '5.56x45mm NATO air-cooled, gas-operated, magazine-fed carbine'),
(2, 'AK-47', 'WEAPON', '7.62x39mm gas-operated assault rifle'),
(3, 'Humvee', 'VEHICLE', 'High Mobility Multipurpose Wheeled Vehicle (HMMWV)'),
(4, '5.56mm Ammo', 'AMMUNITION', 'Standard 5.56x45mm NATO rifle ammunition (boxes of 1000)'),
(5, '7.62mm Ammo', 'AMMUNITION', 'Standard 7.62x39mm rifle ammunition (boxes of 1000)');

SELECT setval('equipment_types_id_seq', (SELECT MAX(id) FROM equipment_types));

-- Seed Users (Password for all seed users is 'Password123!', hashed by seedRunner)
INSERT INTO users (id, username, password_hash, role, base_id) VALUES
(1, 'admin', '$2b$10$w09ZlM6E1K6DqQG4TjD10.sP7V3LwQn2N.Kx6T7mR.N9X8W8b.G1e', 'ADMIN', NULL),
(2, 'commander_alpha', '$2b$10$w09ZlM6E1K6DqQG4TjD10.sP7V3LwQn2N.Kx6T7mR.N9X8W8b.G1e', 'BASE_COMMANDER', 1),
(3, 'commander_bravo', '$2b$10$w09ZlM6E1K6DqQG4TjD10.sP7V3LwQn2N.Kx6T7mR.N9X8W8b.G1e', 'BASE_COMMANDER', 2),
(4, 'logistics_officer', '$2b$10$w09ZlM6E1K6DqQG4TjD10.sP7V3LwQn2N.Kx6T7mR.N9X8W8b.G1e', 'LOGISTICS_OFFICER', 1);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Initial Purchases
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, purchase_date, created_by) VALUES
(1, 1, 1, 150, NOW() - INTERVAL '30 days', 1), -- Fort Alpha: 150 M4 Carbines
(2, 1, 3, 25,  NOW() - INTERVAL '28 days', 1), -- Fort Alpha: 25 Humvees
(3, 1, 4, 500, NOW() - INTERVAL '25 days', 1), -- Fort Alpha: 500 boxes 5.56mm Ammo
(4, 2, 2, 100, NOW() - INTERVAL '20 days', 1), -- Fort Bravo: 100 AK-47s
(5, 2, 5, 300, NOW() - INTERVAL '18 days', 1), -- Fort Bravo: 300 boxes 7.62mm Ammo
(6, 3, 1, 80,  NOW() - INTERVAL '15 days', 1), -- Fort Charlie: 80 M4 Carbines
(7, 3, 4, 200, NOW() - INTERVAL '12 days', 1); -- Fort Charlie: 200 boxes 5.56mm Ammo

SELECT setval('purchases_id_seq', (SELECT MAX(id) FROM purchases));

-- Seed Transfers
INSERT INTO transfers (id, source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, initiated_by, status) VALUES
(1, 1, 2, 1, 30, NOW() - INTERVAL '10 days', 4, 'COMPLETED'), -- Alpha -> Bravo: 30 M4 Carbines
(2, 1, 3, 4, 50, NOW() - INTERVAL '8 days',  4, 'COMPLETED'); -- Alpha -> Charlie: 50 boxes 5.56mm Ammo

SELECT setval('transfers_id_seq', (SELECT MAX(id) FROM transfers));

-- Seed Assignments
INSERT INTO assignments (id, base_id, equipment_type_id, quantity, assigned_to, assignment_date, created_by) VALUES
(1, 1, 1, 40, 'Alpha Recon Platoon 1', NOW() - INTERVAL '7 days', 2), -- Fort Alpha assigned 40 M4s
(2, 1, 3, 10, 'Alpha Convoy Team B',   NOW() - INTERVAL '5 days', 2), -- Fort Alpha assigned 10 Humvees
(3, 2, 2, 25, 'Bravo Defense Squad',    NOW() - INTERVAL '4 days', 3); -- Fort Bravo assigned 25 AK-47s

SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));

-- Seed Expenditures
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, expenditure_date, reason, created_by) VALUES
(1, 1, 4, 30, NOW() - INTERVAL '3 days', 'Tactical Training Exercise Alpha', 2), -- Fort Alpha expended 30 ammo boxes
(2, 2, 5, 20, NOW() - INTERVAL '2 days', 'Firing Range Readiness Drill',     3); -- Fort Bravo expended 20 ammo boxes

SELECT setval('expenditures_id_seq', (SELECT MAX(id) FROM expenditures));

-- Seed Audit Logs
INSERT INTO audit_logs (id, user_id, action, details) VALUES
(1, 1, 'PURCHASE', '{"baseId": 1, "equipmentTypeId": 1, "quantity": 150, "note": "Initial procurement"}'),
(2, 4, 'TRANSFER', '{"sourceBaseId": 1, "destinationBaseId": 2, "equipmentTypeId": 1, "quantity": 30}'),
(3, 2, 'ASSIGNMENT', '{"baseId": 1, "equipmentTypeId": 1, "quantity": 40, "assignedTo": "Alpha Recon Platoon 1"}'),
(4, 2, 'EXPENDITURE', '{"baseId": 1, "equipmentTypeId": 4, "quantity": 30, "reason": "Tactical Training Exercise Alpha"}');

SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));
