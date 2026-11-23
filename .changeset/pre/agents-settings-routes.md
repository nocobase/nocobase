---
'@nocobase/app-plugin-agents': minor
---

Add the `settingsRoutes` client option: `agents({ settingsRoutes: true })` registers Agents, Runtimes, Skills, Models and Usage as System settings pages in the built-in AI category, under `/settings`, each behind its existing page grant. The route definitions are also exported ready-made as `agentsSettingsRoutes` from `client/routes`. Pages mounted there link to one another inside `/settings`: creating, cancelling or deleting a skill returns to the library where it is mounted, and an agent in Usage opens the agents page. Without the option the plugin still registers no routes.
