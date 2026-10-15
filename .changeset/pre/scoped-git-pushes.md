---
'@nocobase/studio': patch
'@nocobase/app-plugin-projects': patch
---

Scope Studio's pull request announcements (`studio:git`) to the issues they affect. Stores of a moment are gathered into one announcement naming the issues the changed pull requests are linked to, and pages read again only those issues' pull requests, marks, previews and progress, through one subscription per page; an announcement it cannot tie to pull requests, and a reconnect, still refresh everything. The topic now reaches signed-in connections only, and a hidden tab no longer polls an issue's previews. Also removes a duplicated type import in the projects plugin's issue queries.
