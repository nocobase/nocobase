---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-projects': patch
---

Read the dashboard, usage and metrics reports with a fixed number of queries whatever the number of issues, runs and usage records: runs, usage and issues are read in one query each with only the columns the figures use, model usage outside runs is summed in the database, and issue facts are read in three queries instead of two per 200 issues. The Studio dashboard now loads each panel from its own route, `GET /api/reports/delivery`, `GET /api/reports/agents` and `GET /api/reports/projects` (CLI `report delivery`, `report agents`, `report projects`), each loading, failing and refreshing on its own; `GET /api/reports/dashboard` and `report dashboard` are removed.
