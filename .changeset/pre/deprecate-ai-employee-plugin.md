---
"@nocobase/app-template-default": minor
"@nocobase/app-template-examples": minor
"@nocobase/app-plugin-ai-employee": patch
"@nocobase/app-skills": patch
---

Deprecate `@nocobase/app-plugin-ai-employee` and stop installing it in the application templates

The plugin is deprecated and no longer developed; its README says so. Default and Examples no longer depend on `@nocobase/app-plugin-ai-employee` or `@nocobase/ai-employee`, register the plugin in `client/plugins.ts`, `server/plugins.ts` and `cli/plugins.ts`, or ship `server/config/ai.ts` and the commented `ai` section of `config.example.yml`. Examples also drops its AI employee demonstration: the global AI entry around `AppLayout`, the `nocobase-ai` and `nocobase-ai-employee-example-tasks-page` extensions, the **AI employee tasks** homepage link, and `@nocobase/app-plugin-ai-employee-example`.

The application development Skill no longer recommends the plugin or documents its `ai-employee` commands, and the upgrade Skill describes what removing it involves.

An existing application keeps the plugin unless it removes it. An upgrade that follows the template asks first: an application that configured an LLM service or has AI employees, conversations or an `ai/` directory keeps the plugin, its registrations and its configuration, and the plugin's current release keeps working there. Removing it unregisters the plugin but leaves its tables and data in the database.
