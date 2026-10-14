# Application Templates, Plugin Permissions and UI Styling

Read this before changing either application template, registering a plugin's business permissions, or styling application UI.

## Keeping the Application Templates in Sync

`packages/templates/app-template-default` and `packages/templates/app-template-examples` are two applications built on the same framework. A change to the framework layer of one belongs in all applicable templates by default: the runtime composition roots, the client shell, routing, layouts and theme, the server entry points, the `cli/plugins.ts` composition root, the `package.json` scripts, tsconfigs, and the agent-facing documentation — `AGENTS.md`, `CLAUDE.md`, and `README.MD`. Shared application Skills live in `packages/app/app-skills` and synchronize into each application from the `@nocobase/app-skills` dependency.

They drift otherwise, and the drift is invisible until someone hits it. Both templates carried a `tsconfig.migrations.base.json` that nothing referenced, and both omitted `database/**/*.ts` from `tsconfig.server.json`, so an application-owned migration ran under `pnpm nocobase db apply` but was silently dropped by `pnpm build` — the same defect, twice, because a fix to one was never carried across.

Not everything transfers. Examples owns its demonstration homepage, article module, and example plugin composition. Each template keeps its own identity and the parts that follow from what it is: `package.json` name, `displayName`, and version; `nocobase.templateKind` and its plugin list; the pages, locales, and branding that make it that product. When a documentation change mentions the other template by name, reword it rather than copying the sentence.

`packages/apps/` is outside this rule. An application there, such as NocoBase Studio, is built on a template rather than being one, and takes a newer template through its `nocobase-app-upgrade` Skill like any generated application; a framework change it needs is made in the same pull request as the Studio change, but the templates are not edited to match it.

Apply all applicable sides in one change and run each affected template's `check`. A framework change that lands in only one template is incomplete, and a reviewer cannot tell whether the omission was a decision or an oversight; if it genuinely does not apply, say so in the pull request.

When a template, application runtime, or CLI change affects how an agent develops, configures, builds, deploys, or upgrades an application, review `packages/app/app-skills` and update the relevant Skill or reference in the same change. Keep the guidance concise and actionable; record the current rule rather than implementation history, and link to existing detail instead of duplicating it.

Each template's `AGENTS.md` follows the same size rule as this repository's: it stays at most 32 KB and holds only always-on rules and an index, and its detailed guidance lives in that template's own `.agents/rules/`, which ships with the template and is committed in every generated application. A change to a template updates the relevant rules file and its index entry rather than growing `AGENTS.md`, and generic framework guidance belongs in `packages/app/app-skills`, linked rather than copied.

## Business Permissions of a Plugin

A plugin registers its own businesses with the authorization plugin from its `shared/access.ts`: a resource type of its own named by the business ids' prefix (`pm` for `pm.issues`), titles and one-line descriptions in its namespace, each level of an action its own action (`edit.related`, `edit.all`; an action without related records as itself), placed in the permission workspace. An application reads what is registered at runtime rather than keeping a union of the plugins' constants. `packages/tools/create-plugin/template/AGENTS.md` carries the rule for generated plugins; change both together.

## Application Themes and UI Styling

For creating or editing theme presets, read `packages/app/app-skills/skills/nocobase-app-development/references/frontend/references/theme.md` from the repository root.

For application UI styling, including plugin UI rendered in an App, use the shared color, font, size, spacing, radius and shadow contract in `packages/app/app-skills/skills/nocobase-app-development/references/frontend/references/theme.md` from the repository root. Prefer its Tailwind utilities so components respond to theme changes; keep deliberate fixed-size exceptions explicit.
