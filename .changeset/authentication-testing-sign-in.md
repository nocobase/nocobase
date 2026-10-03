---
'@nocobase/app-plugin-authentication': minor
---

A new `@nocobase/app-plugin-authentication/testing` entry lets other packages' tests act as a signed-in user. `signIn(app, { email | username, password })` signs in through the application's own sign-in route and returns the session: its user, its cookie, and a `fetch` that sends requests as that user, resolving a path against the application's API root. `DEFAULT_ADMIN_CREDENTIALS` names the administrator the default-administrator seed creates when `users.initialAdmin` is not configured. Nothing in it depends on a test runner.
