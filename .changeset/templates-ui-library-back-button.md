---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

`BackButton` is published by the NocoBase UI Library as the `back-button` component, and the templates preinstall it the way they do `PageHeader` and the route overlays: `client/components/back-button.tsx` is an exact copy of the item, which `tests/scripts/template-ui-library.test.mjs` keeps in step with the library, and `AGENTS.md` lists `BackButton` among the components that come from it. The development Skill's list of composed components now says which of them come from the UI Library.

An application generated earlier can take it with `yes n | pnpm exec shadcn add @nocobase/back-button` instead of copying the file, then add `navigation.back` (`Back`, `返回`) to its locale files and correct `package.json` as its `AGENTS.md` describes for any UI Library item.
