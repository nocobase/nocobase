---
'@nocobase/app-plugin-agents': patch
---

Add `PageTitleContext` to `client/config` for applications that render the agents pages under a heading or tab bar of their own. With `screenReaderOnly` provided around them, each page keeps its `h1` for screen readers only, and its description and actions take the title's row; a covering page, such as a skill's, still shows its title. Applications no longer need a CSS selector to hide the pages' titles.
