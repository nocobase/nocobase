---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Organize application tests by client, server, database, CLI and project source domains, with separate jsdom and Node Vitest projects. Keep browser tests in Playwright, run Node suites sequentially, use real application fixtures in home, inbox, sidebar permission and layout tests, and update the bundled testing guidance and commands.

Replace mocked authentication, permission hooks and article/numeric API clients in existing template tests with real application, cookie and database fixtures. Verify actual session revocation, persisted permission changes, successful retries and saved article contents. Keep deliberate network failures and delayed responses at the transport boundary.
