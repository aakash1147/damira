# DAMIRA by Gupta — Business Management System

A production-grade, modular, and scalable enterprise Business Management System built for **DAMIRA by Gupta**.

---

## 1. Architectural Overview & Technology Stack

The DAMIRA Business Management System is architected as a **Modular Monolith** adhering to Clean Architecture principles:

- **Frontend**:
  - Angular 18+ (Standalone Components, No legacy NgModules)
  - TypeScript
  - Angular Material 18+ with custom **DAMIRA Royal Purple** Theme Tokens
  - SCSS with CSS Custom Properties
  - Reactive Forms with custom Indian GSTIN, PAN, and PIN code validators
  - Angular Router with lazy loading (`loadComponent`), route guards (`AuthGuard`, `PermissionGuard`, `GuestGuard`)
  - HTTP Interceptors (JWT Bearer injection and silent 401 refresh token rotation)
  - Angular Signals (`signal`, `computed`, `effect`) for reactive state management
  - Responsive multi-device layout (collapsible sidebar, responsive tables, cards)
- **Backend**:
  - Node.js & NestJS 10+
  - TypeScript
  - REST API Architecture with versioning prefix (`api/v1`)
  - Dual-Token Authentication (15-minute JWT Access Token + 7-day SHA-256 rotating Refresh Token)
  - Argon2 password hashing (memory-hard, GPU/ASIC resistant)
  - Brute-force account lockout policy (15 minutes after 5 failed attempts)
  - Granular Role-Based Access Control (RBAC) at module and action level (`@RequirePermissions('CUSTOMERS:VIEW')`)
  - DTO validation via `class-validator` and `class-transformer` (strict runtime whitelisting)
  - Global Exception Filter (RFC 7807 problem details) & Logging Interceptor
  - Swagger OpenAPI interactive API documentation at `/api/docs`
- **Database & Persistence**:
  - MySQL 8.0 Engine (InnoDB, Foreign Key Integrity, B-Tree Indexes)
  - Prisma ORM 6+ with automated schema migrations
  - Soft Deletion (`is_deleted` flag) preserving historical audit trails
  - Interactive Transactions (`$transaction`) for multi-entity consistency
  - System Audit Logging (`audit_logs`) tracking JSON before/after state diffs
- **DevOps**:
  - Docker & Docker Compose multi-container setup (MySQL 8.0, NestJS API, Angular Nginx)
  - Multi-stage Docker builds for minimal production image footprint
  - Centralized environment configuration (`.env.example`)

---

## 2. Brand Identity & Design System

- **Brand**: DAMIRA by Gupta
- **Primary Accent**: Deep Royal Purple (`#5B21B6`), Vivid Purple (`#7C3AED`)
- **Neutrals**: Crisp White (`#FFFFFF`), Off-White Slate (`#F8FAFC`), Charcoal (`#0F172A`)
- **Typography**: Plus Jakarta Sans
- **UI Framework**: Angular Material styled with clean, rounded enterprise cards

---

## 3. Implemented Modules

### 1. Authentication & Security
- Strictly internal access with **NO public registration**.
- Super Admin and Administrators onboard employees manually.
- Login with Argon2 verification, failed attempt tracking, and lockout.
- Token refresh rotation with revocation detection.
- Password change and secure temporary credential resets.
- Route guards (`AuthGuard`, `PermissionGuard`, `GuestGuard`) and template structural directive (`*hasPermission="['CUSTOMERS', 'CREATE']"`).

### 2. Company & Employee Management
- Complete HR entity with unique employee codes (`DAMIRA-EMP-XXXX`), joining dates, department, designation, and reporting manager hierarchy.
- Separate but linked internal user login accounts.
- Simultaneous employee onboarding and user account provisioning with automatic temporary password generation (`Dmr@<hex>!`).
- Active, Probation, Notice Period, Resigned, and Terminated statuses.
- Soft deletion archiving.

### 3. Role-Based Access Control (RBAC)
- 4 Builtin System Roles: `Super Admin`, `Admin`, `Manager`, `Employee`.
- Dynamic Custom Role creation.
- Granular Module-Action Permissions catalog:
  - `CUSTOMERS` (`VIEW`, `CREATE`, `EDIT`, `DELETE`, `IMPORT`, `EXPORT`)
  - `EMPLOYEES` (`VIEW`, `CREATE`, `EDIT`, `DELETE`)
  - `USERS` (`VIEW`, `MANAGE`)
  - `ROLES` (`VIEW`, `MANAGE`)
  - `MASTER_DATA` (`VIEW`, `MANAGE`)
  - `AUDIT_LOGS` (`VIEW`)
  - `REPORTS` (`VIEW`)
  - `SETTINGS` (`MANAGE`)

### 4. Customer Relationship Management (CRM)
- Customer profiles for Individuals, Retailers, Distributors, Wholesalers, Corporates, and Bulk Buyers.
- Validated fields: Indian 15-character GSTIN, 10-character PAN, 10-digit mobile, email, and DOB.
- Server-side multi-filter search, sorting, and pagination.
- Excel (`.xlsx`) and CSV customer data export.
- Customer Profile with **6 Dedicated Tabs**:
  1. **Overview**: Commercial, demographic, and taxation metadata.
  2. **Addresses**: Multi-address cards with default billing/shipping toggles.
  3. **Orders**: Expansion placeholder for future sales order integration.
  4. **Payments**: Expansion placeholder for ledgers and GST invoicing.
  5. **Notes**: Internal CRM interaction logs.
  6. **Activity History**: Audit log timeline for this customer.

### 5. Multiple Customer Address Management
- 1:N relational architecture: each customer can maintain multiple addresses (Office, Home, Billing, Delivery, Warehouse).
- Transactional guarantee: setting an address as Default Billing or Default Shipping automatically unsets existing defaults within atomic database transactions.
- Address fields: Label, Address Line 1, Address Line 2, Landmark, Country, State (with GST code), City, District, PIN code, Contact Person, and Contact Mobile.

### 6. Customer Bulk Import Wizard
- Formats: Excel (`.xlsx`) and CSV (`.csv`).
- 4-Step Wizard:
  1. Download documented sample template & upload spreadsheet.
  2. Preview uploaded rows with row-by-row validation diagnostics.
  3. Duplicate Handling Strategy:
     - `SKIP`: Skips duplicate records; only imports new.
     - `UPDATE`: Updates existing customer details.
     - `IMPORT_NEW`: Generates new codes and inserts as separate entities.
  4. Ingestion summary and downloadable Excel error report with exact row numbers and error descriptions.
- Batch processing in atomic chunks of 500 records per transaction.
- Full upload history audit log.

### 7. Master Data Management
- Normalized master data registries:
  - **Countries**: Name, ISO2, ISO3, Phone Dial Code.
  - **States**: All 36 Indian States and Union Territories with official GST State Codes.
  - **Cities**: Normalized city records linked to states.
  - **Classifiers**: Customer Types, Address Types, Departments, Designations.
- Dynamic addition of master data records without code modification.

### 8. System Audit Logging
- Immutable change logs recording User, Action, Module, Record ID, IP address, user-agent, and timestamp.
- Frontend audit viewer with filter by module and action.
- Interactive modal showing formatted JSON state before and after the modification.

---

## 4. Quick Start & Execution

### Option A: Using Docker Compose (Recommended)
```bash
cd docker
docker-compose up -d --build
```
- Frontend UI: `http://localhost`
- Backend API: `http://localhost:3000/api/v1`
- Swagger OpenAPI Docs: `http://localhost:3000/api/docs`

### Option B: Local Development

#### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run start
```
Navigate to `http://localhost:4200` in your web browser.

---

## 5. Seeded Super Admin Credentials

- **Username**: `superadmin`
- **Password**: `DamiraAdmin2026!`
- **Role**: `Super Admin` (Unrestricted authority across all modules)

## 6. Dashboard and Geography KPI Definitions

Geographical sales use each order's stored delivery address, not the customer's current address. Orders without a usable delivery location are retained under an unmapped location rather than assigned to a current address.

| KPI | Calculation |
|---|---|
| Total Net Revenue | Sum of `netAmount` for non-cancelled orders. `RETURNED` orders contribute zero; `REFUNDED` orders use their persisted post-refund `netAmount`. |
| Total Commercial Orders | Count of unique, non-cancelled orders, including returned and refunded orders. |
| Registered Customers | Count of unique, non-deleted customers matching the selected filters. |
| Units Dispatched | Sum of `totalUnits` for `SHIPPED` and `DELIVERED` orders only. |
| Average Order Value | Total Net Revenue divided by Total Commercial Orders; zero when there are no qualifying orders. |
| Repeat Customers | Unique customers with at least two `SHIPPED` or `DELIVERED` orders. |
| Repeat Purchase Rate | Repeat Customers divided by unique customers with at least one `SHIPPED` or `DELIVERED` order. |
| Average Orders per Customer | Count of `SHIPPED` and `DELIVERED` orders divided by unique customers with at least one such order. |

Cancelled orders are excluded from sales and order KPIs. For returned orders, recognized gross profit is the negative shipping and packaging costs still incurred. Other order statuses use persisted `grossProfit`; no percentage-based revenue or cost estimates are substituted.

The monthly repeat-purchase chart counts subsequent `SHIPPED`/`DELIVERED` orders per customer within the selected result set; it does not extrapolate a repeat-order count from the overall repeat-purchase rate.
