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
