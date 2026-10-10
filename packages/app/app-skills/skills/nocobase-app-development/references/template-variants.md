# Official application template variants

Use this reference only after inspecting the application. `package.json` identifies ancestry through `nocobase.templatePackage` and `nocobase.templateKind`; the direct dependencies, `client/plugins.ts`, `server/plugins.ts`, `cli/plugins.ts`, `server/config/index.ts`, and `database/` describe the current application. Those current files take precedence over the defaults recorded here, because generated applications are intended to be changed.

A template not listed here is still supported. Derive its capabilities from the same manifest, registration, configuration, and database files, then follow the common development rules in this Skill. Add a section here only when a template introduces a reusable framework convention that cannot be discovered from its source.

## Default

`@nocobase/app-template-default` is the clean application starting point. It begins with a localized homepage, required permission initialization, no application-owned business routes or services, no example plugins, and no demo data. Its Users integration exposes Authorization Permission Sets as direct application roles. Preserve this clean boundary when editing the template itself; runnable demonstrations belong in Examples.

## Examples

`@nocobase/app-template-examples` intentionally contains demonstrations. It retains the Default Users and API Keys integrations, application-owned article examples, example plugins, and demo data. Users lists direct Authorization Permission Sets as application roles while authenticated default access remains separate; API Keys is configured in both authentication factories and mounted under Settings.

Examples demonstrates a managed `analytics` SQLite connection under `database/analytics/`, an external-schema `externalCrm` connection under `database/externalCrm/`, and a heartbeat configuration and job. Analytics owns `channels`, `campaigns`, and `dailyMetrics`; monetary values use integer cents. `server/routes/analytics.ts` exposes the connection through `analyticsChannels`, `analyticsCampaigns`, and `analyticsDailyMetrics` with explicit `connection: 'analytics'`, and server-side policies constrain fields and relation writes. Treat these as examples to study rather than capabilities every generated application has.
