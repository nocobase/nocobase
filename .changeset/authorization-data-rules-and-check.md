---
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-authz-restriction-rules': minor
---

Data rules in Roles and permissions now edit Default access, Sharing rules and Restriction rules side by side: each kind is a tab its plugin adds, its rules read as one sentence in the list, and a rule is created, edited and deleted in a side sheet over the list, naming who a sharing or restriction rule applies to, its reason and a preview. A sharing rule never offers every record. Closing a rule with unsaved changes asks once, and the old Default access create and edit addresses open the sheet. A new Permission check tab, for unrestricted roles, picks a user and lists everything the user may do with the role it comes from, or checks one operation step by step through roles, default access, sharing and restriction rules. It only reads.
