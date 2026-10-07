---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Inline the authentication, API keys and users plugin clients in each template's Vitest configuration. The authentication guards now read the router location, and loaded by Node they reached a different copy of `react-router` than the test's router, so a generated application's shell and settings tests failed with `useLocation() may be used only in the context of a <Router> component`. The API keys and users clients are inlined with it so they resolve the same authentication tokens and provider.
