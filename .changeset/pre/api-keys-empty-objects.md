---
'@nocobase/app-plugin-api-keys': patch
---

A key scope's group may now be limited to an empty list of records, which reaches none of them: the key holds the group's actions, so the commands and routes that need them are offered, while every record the owning plugin checks is refused. This lets a key be issued before the records it will reach exist, such as a repository's CI key before the repository has any App.
