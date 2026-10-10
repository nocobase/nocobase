# Plugin Skills

Read this reference when a plugin exposes capabilities that an App Agent must discover, integrate, configure, or diagnose. Plugin Skills explain how an App uses stable plugin capabilities; they are not instructions for editing the plugin's private implementation.

## Source and synchronized output

```text
<plugin>/skills/<skill>/       plugin-owned published source
             ↓ skills sync
<app>/.agents/skills/<skill>/  generated local copy read by the App Agent
```

The plugin's top-level `skills/` directory is authoritative. The entire App-side `.agents/` tree is ignored generated state and must not be committed or edited as source. Synchronization replaces each managed Skill directory wholesale, records package ownership in `.agents/.skills-sync.json`, and removes tracked copies that disappeared upstream during a full sync. App-owned Skills whose directory names do not start with `nocobase-` are preserved.

Plugin Skills do not register Client, Server, or CLI contributions and do not enable runtime behavior. A plugin needs them only when an App Agent benefits from knowledge of public components, hooks, Tokens, APIs, Registry items, data-model prerequisites, permissions, workflows, or operational constraints.

## Scaffold and replace the draft

Select the capability explicitly when creating a plugin:

```bash
pnpm plugin:create audit-log --with skills
```

The generated `SKILL.md` is a development draft. It does not prove that any claimed Route, Service, component, or workflow exists. Replace every placeholder with verified behavior before registering the plugin with an App.

Publish Skills with the package:

```json
{
  "files": ["dist", "skills"]
}
```

Use the maintained Skills Example plugin (`packages/examples/app-plugin-skills-example`) as the smallest complete reference. It connects a public Client component, a Server `ServiceToken`, an authenticated API, an App-owned page integration, and behavior verification instead of demonstrating Markdown structure alone.

## Name Skills by package ownership

For `@nocobase/app-plugin-audit-log`, the owned prefix is `nocobase-app-plugin-audit-log`. A plugin may ship that exact Skill and additional task-specific Skills using the same prefix plus a suffix:

```text
skills/
├── nocobase-app-plugin-audit-log/
│   └── SKILL.md
└── nocobase-app-plugin-audit-log-diagnostics/
    └── SKILL.md
```

Use lower-case kebab-case. Do not claim another plugin's prefix, and split multiple Skills by independent App tasks rather than by `client/`, `server/`, or other source directories.

## Write for App tasks

Use the task an App Agent receives as the organizing principle, such as “attach files to a business record” or “trigger and diagnose a workflow.” The frontmatter `name` must match the directory and the `description` must state concrete triggers and meaningful exclusions.

Keep the main `SKILL.md` focused on routing, prerequisites, the shortest useful workflow, ownership, and completion checks. Put substantial schemas, API contracts, examples, and diagnostics in directly linked `references/` files. References must be reachable from `SKILL.md` without a chain of unrelated pages.

Describe only implemented public surfaces:

- Importable Client components, hooks, factories, props, and options.
- Server exports, original ServiceTokens, public APIs, and supported Route factories.
- Collections, fields, relations, permissions, and configuration the App must own.
- Pages, Settings entries, Registry items, CLI commands, and other composable capabilities.
- Required call order, inputs, outputs, identity, idempotency, retry limits, lifecycle, capacity limits, and observable failure behavior.

Do not make private modules, internal tables, deep source paths, copied implementations, general repository rules, or design history part of the App contract.

## State ownership and public entry points

For every capability, make these facts unambiguous:

```text
App owns       page composition, business collections, permissions, invocation timing
Plugin owns    public components, Tokens, Routes, internal persistence, runtime behavior
Public entry   package export, API path, UI entry, CLI command, or Registry item
Do not bypass  private modules, internal tables, or synchronized Skill copies
```

An importable Client subpath is not automatically a Client Runtime contribution. If an App imports `@nocobase/app-plugin-example/client/components/notice`, that alone does not justify adding the package to `client/plugins.ts`. Runtime registration requires a real `exports["./client"]` declaration that contributes config, ServiceProviders, React Providers, Routes, or locales. Write this distinction explicitly so an App Agent does not infer composition from a source path.

Likewise, tell Server consumers to import the original owner-created `ServiceToken`; recreating a Token with the same name produces a different identity.

## Describe permissions and verification

State authentication and authorization separately. Name the caller identity, resource and action, relevant scope, and data boundary. If an authenticated endpoint intentionally has no additional authorization because it returns fixed non-sensitive data, say so and require reassessment when the response becomes user-specific or private.

Give a short executable workflow: confirm prerequisites, create App-owned data or permissions, call the public entry, verify an observable result, and diagnose known failures. Use real names and inputs rather than placeholders.

Verification should assert a response, visible page state, database record, Job status, CLI output, or log produced by the public workflow. Skill file equality proves only synchronization. `plugin inspect` is an optional read-only diagnostic for unexpected registration problems and does not prove runtime behavior, permissions, tests, or builds.

Update Plugin Skills in the same change whenever public entries, integration steps, inputs, outputs, ownership, permissions, constraints, or verification change. Internal refactors that preserve the App contract do not require Skill changes.

## Synchronize to an App

Plugin registration copies shipped Skills by default unless `--no-skills` is given. The standalone command scans directly declared `@nocobase/*` dependencies and explicitly registered plugins:

```bash
cd packages/templates/app-template-default
pnpm nocobase skills sync
```

Target a complete installed package when needed:

```bash
pnpm nocobase skills sync --package @nocobase/app-plugin-audit-log
```

From the repository root, run `pnpm nocobase skills sync` inside the target App, or pass `--workspace-root . --app <app>`.

Full synchronization discovers direct NocoBase packages from `dependencies`, `devDependencies`, and `optionalDependencies`, then merges plugin names found in the explicit Client, Server, and CLI composition roots. A targeted sync preserves other package owners; a full sync also prunes tracked Skills from removed packages.

After synchronizing, inspect the App copy only to confirm delivery. Make all content edits in `<plugin>/skills/`, rerun synchronization, and verify the App-facing workflow itself.

Current implementation and maintained example:

- Skills synchronization implementation (`packages/app/app-cli/src/lib/skills-sync.ts`)
- Skills sync command (`packages/app/app-cli/src/commands/skills/sync.ts`)
- Skills Example source (`packages/examples/app-plugin-skills-example/skills/nocobase-app-plugin-skills-example/SKILL.md`)
