---
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-api-keys': minor
'@nocobase/app-server': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Add two settings pages to the authentication plugin. System settings › Accounts › Sign-in and authentication (`/settings/authentication`) shows the effective sign-in methods, registration, password, password recovery and session settings, where each value comes from (environment variable, `config.yml`, code or default), the problems to fix such as password recovery being off or `app.publicOrigin` missing, a "How to change" snippet per section, and a guide that builds a single sign-on provider's callback URL and configuration; it is read-only and saves nothing. Personal settings › Account › Account and security (`/me/security`) lets every signed-in person change their password, sign out of other devices, see and sign out command-line and browser sessions, and link or unlink single sign-on and social accounts through Better Auth's own endpoints. Applications replace either page with `authentication({ settingsComponentLoader, accountSecurityComponentLoader })` or `routeComponentOverrides`, and name the providers their sign-in page shows a button for with `authentication({ signInButtons })`.

The authentication plugin adds `GET /api/authentication/settings`, which needs the new `authentication.settings` settings item's `read` action and never returns a secret, signing key, client secret or mail credential, and `GET /api/authentication/providers`, the providers a signed-in person can link. Other plugins add rows to the page's sign-in methods with `signInMethodsToken`; the API keys plugin adds its API keys row. The authorization plugin declares the `authentication.settings` item and binds `authenticationSettingsAccessToken`. `AppConfigAccessor` types the optional `layers()` and `sectionEnvironmentVariables()` that `AppConfig` already implements. The templates' `config.example.yml` points to the new page.
