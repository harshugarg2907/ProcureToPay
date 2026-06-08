# SAP CAP Full Stack Procure-to-Pay

This project implements a CAP Node.js and SAPUI5 freestyle Procure-to-Pay flow.

## Included

- CAP CDS domain model for users, roles, vendors, materials, PR, RFQ, PO, QC, GR, invoices, and payment runs.
- OData V4 service at `/odata/v4/p2p`.
- Business actions for PR submission/approval, RFQ issue, PO approval, QC usage decision, GR posting, 3-way invoice match, payment advice, and payment execution.
- XSUAA role templates for Admin, Procurement Officer, QC Inspector, Goods Receipt Officer, Finance Officer, and Viewer.
- CSV seed data for the full process.
- SAPUI5 freestyle XML application under `app/p2p-ui`.
- Role-based launchpad tiles and route guarding.
- XML fragments, reusable library modules, custom controls, XML composite control, mock server support, and analytics page.

## Run Locally

```bash
npm install
npm run deploy
npm run watch
```

Open the CAP launch page:

```text
http://localhost:4004
```

The UI5 app is served by CAP through `cds-plugin-ui5` once dependencies are installed. You can also open:

```text
http://localhost:4004/p2p-ui/index.html
```

Mock UI mode:

```text
http://localhost:4004/p2p-ui/index.html?mock=true
```

## Local Users

| User | Role |
| --- | --- |
| admin | Admin |
| jsmith | Procurement Officer |
| qinspector | QC Inspector |
| grofficer | Goods Receipt Officer |
| finance | Finance Officer |
| viewer | Viewer |

Use the launchpad user selector to simulate local role behavior.

## Backend Verification

```bash
npx cds compile srv --to edmx
npm run deploy
```

## UI Verification

```bash
npm run lint:ui5
```

## Deployment

The project includes `mta.yaml` and `xs-security.json` for a Cloud Foundry style BTP deployment with XSUAA and an HDI container.

## Architecture

- **Backend**: SAP Cloud Application Programming Model (CAP) Node.js service exposing an OData V4 service at `/odata/v4/p2p` defined by the CDS models in `srv/` and `db/`.
- **Service files**: CDS models and service logic live in `db/schema.cds` and `srv/p2p-service.cds` / `srv/p2p-service.js`.
- **UI**: SAPUI5 freestyle applications under `app/` (main UI at `app/p2p-ui`) served by `cds-plugin-ui5` through the CAP server.
- **Persistence**: Local development uses SQLite seed data located in `db/data/` (CSV files) and a generated `db.sqlite` when deployed locally.
- **Security & Deployment**: XSUAA role templates in `xs-security.json`, `mta.yaml` and `Makefile_20260606194424.mta` included for Cloud Foundry/CF-like deployments.

## Data & Seed

- **Seed CSVs**: The repository includes CSV seed files in `db/data/` for Users, Roles, Vendors, Materials, PRs, RFQs, POs, GRs, Invoices, and Payment Runs. These are imported when running `cds deploy` or local seed/import scripts.
- **Local DB files**: You may see `db.sqlite`, `db.sqlite-shm`, and `db.sqlite-wal` in this workspace for local testing. Backups may be present (e.g., `db.sqlite.backup-*`).

## Pages & Templates Overview

This project contains multiple UI modules under `app/`. Below is a concise overview of the primary pages, their template types, and purpose/workflow responsibilities:

- **Launchpad / Router** (`app/router`): Freestyle launchpad and route guarding; provides user/role selector for local testing and orchestrates navigation between tiles.
- **p2p-ui** (`app/p2p-ui`): Main SAPUI5 freestyle XML app (launchpad + role-based tiles). Hosts links to analytical and transactional pages.
- **p2p-list-object / p2p-object-pages / p2p-transactional**: Transactional list and object page views (freestyle XML + controllers). Used for CRUD and document workflows (Purchase Requisitions, Purchase Orders, Invoices, etc.).
- **p2p-analytical / dashboard**: Analytical pages and dashboards (charts, KPIs) implemented as UI5 views consuming analytics OData endpoints.
- **procurement-pages**: Reusable procurement UI fragments and pages (lists, filters, helpers) used across transactional apps.
- **login-page**: Custom login/entry page used in local mock or to demonstrate authentication flows.
- **home**: Basic homepage and app shell used as an entry tile in the launchpad.
- **user-management**: Admin-oriented pages for managing users and roles in local demo mode.

For each transactional page the common pattern is:
- List view (filter/search) → detail/object page → business actions (submit/approve/post) → backend CDS action handlers.

## Typical Workflows & Role Responsibilities

- **Procurement Request → Purchase Order**: `jsmith` (Procurement Officer) creates PRs and RFQs; reviewer/admin approves and issues POs.
- **Goods Receipt**: `grofficer` (Goods Receipt Officer) posts Goods Receipts against POs; QC Inspector (`qinspector`) records inspection results when enabled.
- **Invoice Matching & Payment**: Finance Officer (`finance`) performs 3-way invoice match and triggers payment runs; `admin` may run payment execution flows.
- **Viewing / Analytics**: `viewer` role accesses dashboards and read-only views for analytics and reporting.

## Run & Verify (summary)

Run locally:

```bash
npm install
npm run deploy
npm run watch
```

Open the CAP launch page:

```text
http://localhost:4004
```

UI mock mode:

```text
http://localhost:4004/p2p-ui/index.html?mock=true
```

Backend verification (compile OData):

```bash
npx cds compile srv --to edmx
npm run deploy
```

UI verification:

```bash
npm run lint:ui5
```

---
If you'd like, I can also split the pages overview into a short per-module table with file links to the main controller/view files for quicker navigation.
