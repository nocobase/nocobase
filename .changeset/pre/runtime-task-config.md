---
"@nocobase/db": minor
"@nocobase/app-server": minor
"@nocobase/app-cli": minor
"@nocobase/app-skills": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.
