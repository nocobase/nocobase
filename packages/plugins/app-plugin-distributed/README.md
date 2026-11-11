# Distributed application Skills

`@nocobase/app-plugin-distributed` provides Agent guidance for multi-instance NocoBase applications: shared infrastructure, Redis caching, concurrency, Jobs, Queue, Realtime, rollout and verification.

This public package contains only Skills and documentation. It has no Client, Server or CLI runtime contribution, and does not include or license the commercial Redis implementations. Installing it does not enable distributed operation.

## Install in an application

Install a published version compatible with the application, then synchronize its Skills:

```bash
pnpm add @nocobase/app-plugin-distributed
pnpm nocobase skills sync --package @nocobase/app-plugin-distributed
```

Do not import this package into `client/plugins.ts`, `server/plugins.ts` or `cli/plugins.ts`. Install and register the required runtime plugins separately, following their compatible published versions.

## Ask the Agent

> Prepare this application to run on two instances behind one public URL. Inspect its existing configuration, identify which shared backends it needs, configure the authorized Redis plugins, and verify cross-instance behavior before scaling out.

The Agent starts with [the distributed application Skill](skills/nocobase-app-plugin-distributed/SKILL.md). App configuration and deployment files remain owned by the application; synchronized `.agents/skills/` files are generated output.
