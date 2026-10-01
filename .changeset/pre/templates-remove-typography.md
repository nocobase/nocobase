---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

The templates no longer ship `client/components/typography.tsx`. Its `Typography*` components held the class strings from the shadcn Typography guide for hand-written long-form text, and nothing in the templates or the plugins used them. The development Skill no longer lists them.

An application generated earlier keeps its copy. Delete it, and `tests/components/typography.test.tsx`, only when nothing else in the application imports it.
