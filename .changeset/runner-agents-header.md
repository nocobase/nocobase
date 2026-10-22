---
'@nocobase/app-plugin-agents': patch
---

Move "Show disabled" on the Agents page into the page header's actions, so the list starts right under the page header as on the Models page. `RunnerAgentsSection` from `client/kit` takes an optional `title`, `description` and `actions` for its heading row and a `heading` of `section` (the default, unchanged), `page` or `screenReaderOnly`, so an application can compose it under its own tab bar the same way.
