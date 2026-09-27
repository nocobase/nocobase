---
'@nocobase/app-plugin-authorization': minor
---

The inspector shows inherited access. `POST /inspector/configured` also answers `identity.subjects`, the subjects a user inherits from, and per effective permission set the assignments that bring it (`ConfiguredPermissionSet` in `sets`); the inspector page shows which subjects the user inherits from and whether each granting set comes through one of them or a direct assignment. A subject option's `title` and `description` may be a `{ key, ns }` translation descriptor, which the subject picker, assignment lists, rule panels and inspector render in the viewer's language; the client `SubjectOption` types them as `LocalizedText`. A permission-set assignment change on any subject other than a user now refreshes every signed-in client, so members of a department see the change without reloading.
