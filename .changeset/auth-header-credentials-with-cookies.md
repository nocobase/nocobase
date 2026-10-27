---
"@nocobase/app-plugin-authentication": patch
---

Allow valid API-key requests to retain preference cookies without requiring an Origin header. Authenticate these requests without cookies and preserve their credential identity and scope, while keeping CSRF protection for browser sessions and skipped authentication routes.
