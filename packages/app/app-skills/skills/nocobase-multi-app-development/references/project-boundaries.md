# Workspace and product boundaries

## Establish the real baseline

Read the project README, `package.json` and `pnpm-workspace.yaml` when present; inspect each App's manifest, configuration declarations and client/server/CLI plugin registrations. Record source revisions, dirty files and installed versions. Use NocoBase 3 project guidance, not global NocoBase 2 Portal/CLI workflows.

In the current multi-app template the project root is the complete Main application and `apps/sub/` is one complete business child. They share installation and a lockfile, not business source or runtime data. For other projects inspect the declared App roots; a source folder does not create a deployed instance and receiving these Skills does not convert a single App into a platform.

For a new project, the public command is available only after compatible CLI and template releases include the alias:

```bash
pnpm create @nocobase/app platform --template=multi-app --registry=https://pkg-v3.nocobase.com/
cd platform
```

For unreleased development, use explicitly identified real candidate CLI/template artifacts and record their identities; do not claim the public command is already available. Compatible commercial package versions and authorized download access are separate prerequisites. Do not use a template source checkout, fake plugin or external repository link as proof of independent installation.

Install once at the workspace root. Creation does not configure runtime databases, keys or administrators. Follow the project README to configure root Main and each child and synchronize their installed package Skills. Root `pnpm dev` and `pnpm build` operate Main; `pnpm --dir=apps/sub build` operates the child. Both keep independent production artifacts.

## Decide ownership

| Concern     | Main                                                                  | Child                                                       |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Catalog     | Templates, immutable versions, managed instances and external entries | Its own entry and local switcher                            |
| Identity    | Platform subjects and explicit application membership                 | Local users, verified platform bindings and its own session |
| Permissions | Management rights and admission                                       | Business page and API grants                                |
| Data        | Platform-owned records                                                | Child-owned records, files and migration history            |
| Release     | Main deployment and managed lifecycle                                 | Independent archive or externally operated deployment       |

Membership is not a business permission set, a page grant is not an API grant, and an owner label is not authorization. Choose multiple instances for the same behavior with isolated data, multiple templates for distinct applications, or internal modules when independent data/release ownership is unnecessary.

Source location and hosting mode are separate decisions. A child may live in this workspace or its own repository and still supply a compatible Host artifact. An adjacent App can remain independently hosted. External registration does not transfer deployment, backup or lifecycle ownership.

## Replace demonstration coupling deliberately

Inventory business pages, role mapping, migrations and seeds before choosing what a new product retains. Do not remove generic management/identity routes or change persisted permission IDs merely to hide demonstrations. Never delete old migrations or volumes as source cleanup.

When supplied by the multi-app template, `scripts/demo.mjs` starts built Main from the project root. It invokes preparation only with explicit `--initialize --plan`; the plan supplies actual artifacts/versions and instance IDs. No fixed second version or retired sample builder is required. Keep product initialization explicit, idempotent and separate from ordinary startup.

Record responsibility boundaries, package identities versus persistent IDs, retained example behavior, hosted/external mode and the initial permission plan. Existing populated installations route to `nocobase-multi-app-migration`; publication and operations route to `nocobase-multi-app-deployment`.
