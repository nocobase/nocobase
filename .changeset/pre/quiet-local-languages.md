---
'@nocobase/app-client': patch
'@nocobase/app-skills': patch
---

Store language choices separately for each application's full mount path so applications on the same origin retain their own defaults and preferences. The previous shared choice is left untouched and no longer read; after upgrading, each application starts in its default language until the visitor chooses again. Update the screenshot tool to preset the application-specific language choice.
