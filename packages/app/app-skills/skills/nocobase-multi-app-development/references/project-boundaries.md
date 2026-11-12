# Application and deployment boundaries

## Establish the real baseline

Read the project README, `package.json` and `pnpm-workspace.yaml` when present; inspect each App's manifest, configuration declarations and client/server/CLI plugin registrations. Record source revisions, dirty files and installed versions. Use NocoBase 3 project guidance, not global NocoBase 2 Portal/CLI workflows.

The commercial multi-app template creates Main only. A child is a separate complete application that provides `dist.tar.gz`; Main does not inspect or import its source directories. Each create-app invocation creates one application.

For a new project, the public command is available only after compatible CLI and template releases include the alias:

```bash
pnpm create @nocobase/app platform --template=multi-app --registry=https://pkg-v3.nocobase.com/
cd platform
```

For unreleased development, use explicitly identified real candidate CLI/template artifacts and record their identities; do not claim the public command is already available. Compatible commercial package versions and authorized download access are separate prerequisites. Do not use a template source checkout, fake plugin or external repository link as proof of independent installation.

Configure Main and each independently developed child in their own projects. Creation does not initialize runtime databases, keys or administrators. Run `pnpm build --tar` in the child project and supply `storage/exports/dist.tar.gz` to Main.

## Decide ownership

| Concern     | Main                                                                  | Child                                                       |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| Catalog     | Templates, immutable versions, managed instances and external entries | Its own entry and local switcher                            |
| Identity    | Platform subjects and explicit application membership                 | Local users, verified platform bindings and its own session |
| Permissions | Management rights and admission                                       | Business page and API grants                                |
| Data        | Platform-owned records                                                | Child-owned records, files and migration history            |
| Release     | Main deployment and managed lifecycle                                 | Independent archive or externally operated deployment       |

Membership is not a business permission set, a page grant is not an API grant, and an owner label is not authorization. Choose multiple instances for the same behavior with isolated data, multiple templates for distinct applications, or internal modules when independent data/release ownership is unnecessary.

Source location is not a deployment contract. For managed hosting, Main receives a verified deployment archive, publishes a template version and creates instances. For external hosting, register the independently operated application's public entry; registration does not transfer deployment, backup or lifecycle ownership.

Record package and artifact identities, hosted/external mode and the permission plan. Application creation and Main startup must not implicitly publish versions or provision instances. Publication and operations route to `nocobase-multi-app-deployment`.
