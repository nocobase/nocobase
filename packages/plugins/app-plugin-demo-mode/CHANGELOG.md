# @nocobase/app-plugin-demo-mode

## 0.0.1

- Introduce isolated demo deployments enabled by the boolean `NOCOBASE_DEMO_MODE` environment variable or `demoMode.enabled` configuration, disabled by default, with request-scoped write protection, logical-collection exceptions and application-owned repeatable data generation and cleanup.
- Provide reusable visitor accounts, quick sign-in with application-scoped redirects, permission-gated lifecycle APIs and CLI, reset progress, persisted operation leases and a daily reset on the application's jobs service, firing once a day at the configured local time and every night at 03:00 by default. Preserve sessions for unchanged accounts and apply changed passwords using persisted salted snapshots.
- Offer optional official Agents integration, a persistent simulated model, application-owned simulations and explicit online conversation policies. Preserve existing global model defaults and disable the owned model when Demo Mode is disabled. Document the gateway's raw OpenAI JSON and server-sent event responses.
- Publish structural service contracts, composable management components with collection write exceptions, demo accounts and standard localized error handling, and a task-focused integration Skill with settings-based management authorization, an executable non-AI example and application-owned business adaptation. Use automatic reset defaults and keep customization and simulation guidance conditional on the requested demo.
- Preserve additive migrations required by existing preview deployments; release notes describe the final feature rather than intermediate preview APIs.
