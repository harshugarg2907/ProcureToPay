# User Roles and Login Credentials

This file lists the demo users available in the Procure-to-Pay application and their roles.

> Note: In the current UI mock/login implementation, only the `User ID` is used to select the user. The password field is present for UX completeness but is not validated by the app.

## Demo Users

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin` |
| Procurement Officer | `jsmith` | `jsmith` |
| QC Inspector | `qinspector` | `qinspector` |
| Goods Receipt Officer | `grofficer` | `grofficer` |
| Finance Officer | `finance` | `finance` |
| Viewer | `viewer` | `viewer` |

## How to use

1. Open the login page at `http://localhost:4004/home/index.html` or the CAP launch page.
2. Enter one of the `Username` values from the table.
3. Enter the matching demo password or any value.
4. Click **Log On**.

## Notes

- The app currently uses the username to select the local user profile.
- Passwords are included here for convenience and to mirror a typical login screen.
- If you add real authentication later, replace these demo passwords with secure credentials.
