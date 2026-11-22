---
'@nocobase/app-plugin-file': minor
'@nocobase/app-plugin-projects': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-agent-sessions': patch
---

Add a File storage page under System settings › System. It lists the configured disks with their location, visibility, size limit, completeness and setting sources, lists the features that store files with their disk, download method, file count and total size, and checks that a disk can be written, read, linked and deleted. Plugins declare the features that store files with `registerUsage()`, file repositories exposed with `defineFileRepositoryApiRoutes()` are listed automatically as public links, and the projects, knowledge, agents and agent sessions plugins list their file tables. Responses never include credentials or absolute server paths.
