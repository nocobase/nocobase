# @nocobase/app-plugin-message-broker

Transactional outbox, inbox and outbox relay for the application message broker.

## Generated capabilities

- `database`
- `server.service-providers`

Implement only the public behavior this plugin owns. Keep declarations, exports, dependencies, tests, README, and Plugin Skills aligned when capabilities change. Every concrete Server Route must own and test its authentication and authorization boundary.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-message-broker lint
pnpm --filter @nocobase/app-plugin-message-broker typecheck
pnpm --filter @nocobase/app-plugin-message-broker test
pnpm --filter @nocobase/app-plugin-message-broker build
```
