# Military Asset Management System 🛡️

A production-quality, full-stack **Military Asset Management System** designed for dynamic tracking of military inventory (Vehicles, Weapons, Ammunition) across multiple military bases.

The system provides real-time transactional balance calculations, atomic cross-base transfers using PostgreSQL database transactions, strict Role-Based Access Control (RBAC), central immutable audit logging, and an executive React command dashboard.

---

## 📐 Dynamic Inventory Calculation Model

Asset stock levels are calculated dynamically from transactional records rather than manually maintained static fields:

$$\text{Net Movement} = \text{Purchases} + \text{Transfers In} - \text{Transfers Out}$$

$$\text{Closing Balance} = \text{Opening Balance} + \text{Net Movement} - \text{Assigned} - \text{Expended}$$

### Period & Date-Range Aggregation Rules
- **Opening Balance**: Accumulated balance of all transactions occurring strictly **prior** to the filter `startDate`.
- **Period Movements**: Sums of Purchases, Transfers In, Transfers Out, Assignments, and Expenditures where transaction date falls within `[startDate, endDate]`.
- **Closing Balance**: Calculated dynamically via the exact formula above.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js v20.16.0
- **Framework**: Express.js
- **Database**: PostgreSQL 18.4
- **Database Client**: `pg` (Pool & Client transactions)
- **Security & Auth**: JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Lucide React Icons
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with Bearer Token Interceptor & 401 redirect)
- **Data Visualization**: Recharts (Dynamic Bar & Donut charts)

---

## 🔑 Demo Clearance Credentials

The seed data script generates the following pre-configured test users:

| Username | Password | Role | Assigned Base Clearance |
| :--- | :--- | :--- | :--- |
| `admin` | `Password123!` | **ADMIN** | Unrestricted Global Access (All Bases) |
| `commander_alpha` | `Password123!` | **BASE_COMMANDER** | Fort Alpha (Base #1) |
| `commander_bravo` | `Password123!` | **BASE_COMMANDER** | Fort Bravo (Base #2) |
| `logistics_officer` | `Password123!` | **LOGISTICS_OFFICER** | Fort Alpha (Procurement & Transfers) |

---

## 🔐 Role-Based Access Control (RBAC)

Authorization is strictly enforced on the backend via Express middlewares (`authenticateToken`, `authorizeRoles`, `enforceBaseAccess`):

- **ADMIN**: Access to all endpoints, global dashboard analytics across all military bases, purchases, transfers, assignments, expenditures, and audit logs.
- **BASE_COMMANDER**: Restricted strictly to their assigned base (`baseId`). Backend prevents commanders from viewing or submitting data for other bases (even if request parameters are altered). Permitted actions: View Dashboard, Issue Assignments, Log Expenditures, View Base Audit Logs.
- **LOGISTICS_OFFICER**: Permitted to manage Purchases, Inter-Base Transfers, and view Dashboard metrics.

---

## 🗄️ Relational Database Schema

The system uses a PostgreSQL relational database (`military_asset_management`):

```text
bases (id, name, location, created_at)
users (id, username, password, role, base_id, created_at)
equipment_types (id, name, category, description, created_at)
purchases (id, base_id, equipment_type_id, quantity, purchase_date, created_by, created_at)
transfers (id, source_base_id, destination_base_id, equipment_type_id, quantity, transfer_date, initiated_by, status, created_at)
assignments (id, base_id, equipment_type_id, quantity, assigned_to, assignment_date, created_by, created_at)
expenditures (id, base_id, equipment_type_id, quantity, expenditure_date, reason, created_by, created_at)
audit_logs (id, user_id, action, details, created_at)
```

Indexes are created on frequently aggregated fields (`base_id`, `equipment_type_id`, timestamps) to ensure fast query execution.

---

## ⚡ Atomic Inter-Base Transfers

Transfers between bases are executed within **PostgreSQL database transactions**:

```sql
BEGIN;
-- 1. Check current available inventory at Source Base
-- 2. If requested quantity > available stock, ROLLBACK & return HTTP 400
-- 3. Insert record into transfers table
-- 4. Insert audit record into audit_logs table inside exact same transaction
COMMIT;
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js (v20+) & npm (v10+)
- PostgreSQL 18 running locally on `localhost:5432`
- Database created: `military_asset_management`

### 2. Backend Setup
```bash
cd backend
npm install
node database/seedRunner.js
npm start
```
The backend server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend portal runs on `http://localhost:3000`.

---

## 🧪 Integration Test Suite

Run the full automated integration test suite covering authentication, RBAC boundaries, purchase creation, stock validation, atomic transfers, transaction rollback, dashboard aggregations, and audit logging:

```bash
cd backend
npm test
```

---

## 📡 API Overview

| Method | Endpoint | Authentication | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | None | User authentication & JWT generation |
| `GET` | `/api/auth/me` | Bearer JWT | Any | Fetch active user profile |
| `GET` | `/api/assets/dashboard` | Bearer JWT | Any | Dynamic inventory & net movement metrics |
| `GET` | `/api/purchases` | Bearer JWT | Any | Fetch procurement history |
| `POST` | `/api/purchases` | Bearer JWT | `ADMIN`, `LOGISTICS_OFFICER` | Record new asset purchase |
| `GET` | `/api/transfers` | Bearer JWT | Any | Fetch inter-base transfer logs |
| `POST` | `/api/transfers` | Bearer JWT | `ADMIN`, `LOGISTICS_OFFICER` | Execute atomic cross-base transfer |
| `GET` | `/api/assignments` | Bearer JWT | Any | Fetch personnel assignment logs |
| `POST` | `/api/assignments` | Bearer JWT | `ADMIN`, `BASE_COMMANDER` | Issue asset assignment to unit/personnel |
| `GET` | `/api/expenditures` | Bearer JWT | Any | Fetch expenditure/consumption logs |
| `POST` | `/api/expenditures` | Bearer JWT | `ADMIN`, `BASE_COMMANDER` | Log asset expenditure / ammo consumption |
| `GET` | `/api/audit-logs` | Bearer JWT | `ADMIN`, `BASE_COMMANDER` | Fetch central audit trail |
