---
'@nocobase/app-plugin-projects': patch
'@nocobase/studio': patch
---

The issue board reads a fixed number of queries whatever the number of issues: each column's ids are read in its order, then every column's rows and what they show beside them at once (16 queries instead of about 54). `GET /api/projects/issues` takes `issueIds` (comma-separated, at most 100) to read only some issues within the other filters. On Studio's issue pages the board and the trash now stay current through the app-wide refresh: a change naming issues reads only the rows shown, and the list is read again when one of them left it or changed column, or for a change naming no issues.
