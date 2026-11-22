# Distributed application Skills

`@nocobase/app-plugin-distributed` provides Agent guidance for NocoBase applications that need to support multiple instances. Install it before developing an application to prevent single-process assumptions, or after development to assess and adapt the existing application before deployment. Installation establishes the multi-instance target; the current request determines the work, not when the package was installed.

The Skill covers Jobs, Queue, Caching, Realtime, Concurrency and Snowflake, plus shared data, files and release safety. It checks affected paths during feature development and maintenance, and all applicable capabilities before a first multi-instance deployment. Local development settings are not production evidence; missing production details do not block independent code work. Untested cross-instance behavior and unresolved release conditions remain explicit.

This public package contains only Skills and documentation, with no Client, Server or CLI runtime contribution. It does not include or license commercial implementations. Installation does not configure shared services, require all six commercial plugins or authorize production changes. Existing commercial-package access rules apply. Business behavior and architecture are preserved by default; necessary or beneficial architecture changes require confirmation before implementation.

## Install in an application

Install a published version compatible with the application, then synchronize its Skills:

```bash
pnpm add @nocobase/app-plugin-distributed
pnpm nocobase skills sync --package @nocobase/app-plugin-distributed
```

Do not import this package into `client/plugins.ts`, `server/plugins.ts` or `cli/plugins.ts`. Install and register the required runtime plugins separately, following their compatible published versions.

## Use during development

Continue describing the features you need. The Agent checks relevant business paths for multi-instance compatibility without requiring a production environment or a full deployment audit for every feature. For example:

> Add an order export feature. Users should be able to download the result when it is ready, even if another application instance handled the export.

Code implementation, cross-instance acceptance and production readiness are reported separately. A passing local test does not prove the production backend or deployment is ready.

## Prepare an existing application for deployment

Ask for assessment only or for adaptation, depending on the work you want performed. For example:

> Check whether this application can run on two instances behind one public URL. Explain what needs to change, but do not modify anything yet.

Then, when ready to adapt it:

> Make the recommended adaptations without changing how the business works. Check the cross-instance behavior in a test environment, but do not deploy to production yet.

The Agent reviews existing consumers, data and pending work rather than treating the application as a new project. For subsequent changes or incidents, it reuses valid assessments and checks affected paths instead of automatically repeating the full audit.

The Agent starts with [the distributed application Skill](skills/nocobase-app-plugin-distributed/SKILL.md). App configuration, decisions and deployment records remain owned by the application; synchronized `.agents/skills/` files are generated output.
