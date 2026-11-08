# Installation and version selection

## Before installation

This guide describes `@nocobase/app-plugin-approval` as inspected at version `1.0.0-beta.11` (source revision `c12cc82e7a50a568a2c416c7470cbac9dcb2c350`). That is a source reference, not a claim that the version is already published or that another version is compatible. Check the versions actually available through the customer's authorized registry and their peer requirements against the target application's installed framework. If no compatible release is available, report the missing release instead of installing an incompatible version or cloning commercial source.

The Skill package is public documentation; it grants no commercial runtime entitlement. Use the customer's existing registry configuration and authorized credentials to obtain the runtime package. Do not guess a registry URL or put credentials in this guide, application source or command output. A user who only wants to assess the plugin can read this entire Skill without installing or activating the runtime.

## Install and register the runtime

From the target App root, replace `<compatible-version>` with the available version selected above. Preview the registration plan, then apply it within the requested installation scope:

```bash
pnpm nocobase plugin register @nocobase/app-plugin-approval --version '<compatible-version>' --dry-run --json
pnpm nocobase plugin register @nocobase/app-plugin-approval --version '<compatible-version>' --json
pnpm nocobase skills sync
```

A dry run for an absent package can only preview installation; it cannot inspect exports until the package is present. Inspect the actual registered entries and required configuration after installation. Installation, registration, database application, service configuration and business integration are distinct steps. Use the App's existing database and start/build procedures where required.

Approval requires the Task Center runtime peer; obtain its compatible commercial package too. It contributes optional personal task integration only when the host composes it. Read the Task Center guide from `@nocobase/app-skill-task-center` when needed. The host supplies its business collections, lifecycle, organization rules and approval UI.

Continue with the parent Skill's integration steps. Use the installed plugin's public exports, declarations and README for version-specific details. Verify the requested behavior through the application, including the relevant permission and failure paths; Skill synchronization alone proves only documentation delivery.

## Skill synchronization and upgrades

Install this documentation package as a direct development dependency and run a full `pnpm nocobase skills sync`. A compatible App CLI recognizes its `nocobase-app-plugin-approval` Skill. Before that CLI support is released, read the installed `skills/nocobase-app-plugin-approval/SKILL.md` directly; do not disable namespace validation or edit generated App Skills.

When the runtime also bundles Skills, a full sync chooses that runtime's entire Skill set over the standalone guide. If the runtime ships none, the standalone package remains the guide source. Keep the standalone guide compatible with the installed runtime rather than assuming their npm version numbers match. After upgrading or removing either package, run a full sync to reconcile ownership and remove stale managed copies.
