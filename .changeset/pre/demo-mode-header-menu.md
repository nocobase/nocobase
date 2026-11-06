---
'@nocobase/app-plugin-demo-mode': minor
---

Replace floating and avatar-menu account switching with a standalone DemoModeMenu for application headers. The dropdown combines the demo environment notice, account names and roles, and the current-account check, with preloading and retryable account switching. Applications must mount the new client/menu component in their header and remove the former DemoAccountMenu, accountSwitcher and showFloatingAccountSwitcher integration.

Replace calls to the former demoModeReactProviders factory with the static reactProviders export from client/react-providers.

Ensure account switching reloads the document even when the destination differs only by its hash, so the previous account's client state is discarded while preserving the requested location.
