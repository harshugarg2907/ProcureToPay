# Cloud Foundry Deployment

## Prerequisites

Install these tools on your machine:

- Cloud Foundry CLI
- MultiApps CF plugin: `cf install-plugin multiapps`
- Cloud MTA Build Tool: `mbt`

Your SAP BTP Cloud Foundry space must have entitlements for:

- SAP HANA Cloud / `hana` service plan `hdi-shared`
- XSUAA / `xsuaa` service plan `application`

## Build

```powershell
npm install
npm run build:mta
```

This creates:

```text
mta_archives/sap-cap-p2p_1.0.0.mtar
```

## Login

```powershell
cf login -a <CF_API_ENDPOINT>
```

Choose your org and space when prompted.

## Deploy

```powershell
npm run deploy:cf
```

Or directly:

```powershell
cf deploy mta_archives/sap-cap-p2p_1.0.0.mtar
```

## Open App

After deployment:

```powershell
cf apps
```

Open the route for:

```text
sap-cap-p2p-srv
```

The app redirects to:

```text
/login-page/index.html
```
