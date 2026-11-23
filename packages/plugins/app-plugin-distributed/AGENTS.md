# Distributed plugin guidance

This plugin reports, read-only, which backends the running instance uses and whether the application can run on several instances, and ships the Agent Skills for configuring that. Follow the repository's `AGENTS.md` and the plugin development Skill when maintaining it.

- The page and `GET /api/distributed/status` share the grant `page:distributed.status/access` from `shared/types.ts`; keep the route's `authz` and the server guard on that one constant.
- The response never carries connection options. `server/status.ts` copies fields one by one from each service's `describe()` and the route parses the result through the closed schema in `server/routes/schemas.ts`; never spread or return a configuration object, and keep the leak test in `tests/server/routes.test.ts` covering every new field.
- Whether a backend is shared comes from the adapter's own `sharing` declaration in the owning library or plugin, never from a list of adapter names here.
- The plugin owns no tables, migrations, writes or `distributed` configuration section, and offers no connection test, instance list or cross-instance comparison. Extensions go through `distributedStatusToken` (server checks and data) and `distributedStatusSlotsToken` (client blocks).
- Keep `skills/nocobase-app-plugin-distributed/SKILL.md` focused on application tasks, with detailed guidance in its directly linked references. Verify configuration shapes against current source and installed public contracts. Commercial adapter options belong to the compatible runtime packages; do not invent options or imply this public package includes their implementations or licenses.
- Write published documentation in English, with each prose paragraph on one physical line. README, Skill, exports and tests describe the same contract; run the package's lint, typecheck, test and build, and the templates' checks when registration changes.
