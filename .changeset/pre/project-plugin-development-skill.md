---
"@nocobase/app-skills": patch
"@nocobase/app-cli": patch
"@nocobase/create-plugin": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-plugin-demo-mode": patch
---

Ship plugin development guidance with the App's installed Skills, reserve its existing name for @nocobase/app-skills, and guide upgrades through verifying the project replacement before retiring old global installations. Update application and plugin entry points to use the version-matched project Skill.

Synchronize project Skills as real copies, exclude dependencies installed inside executable examples, and preserve the targets of older project links during migration.
