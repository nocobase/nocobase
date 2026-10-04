# @nocobase/app-plugin-skills-example

A small, real plugin that demonstrates how Plugin Skills describe App-facing
capabilities to an App Agent.

## Public surfaces

- `AppNotice` component:
  `@nocobase/app-plugin-skills-example/client/components/app-notice`
- Server ServiceToken:
  `@nocobase/app-plugin-skills-example/server/tokens`
- Authenticated API: `GET /api/skillsExample/notice`, answering `{ data: { title, description, tone } }`

The component is a direct package export, not a Client plugin contribution.
The Server definition registers the Notice Service and API Route. The Route
requires an authenticated session and intentionally has no additional business
permission because its fixed example response is non-sensitive.

The App-facing integration contract is in
`skills/nocobase-app-plugin-skills-example/SKILL.md`. Registration synchronizes
that package-owned Skill into the target App's `.agents/skills/` directory.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-skills-example check
pnpm nocobase plugin inspect skills-example --workspace-root . --app app-template-default --json
```
