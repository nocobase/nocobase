---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-template-hub": patch
---

Build the sign-in, sign-up and password pages from the UI Library's new presentational `auth-forms`, `auth-methods` and `auth-split-layout` blocks, installed in `client/extensions/nocobase-<item>/`, which replace the `auth-ui` block in `client/extensions/nocobase-auth-ui/`. The forms are made of shadcn `Field`, `InputGroup`, `Alert` and `Button`, method switching uses shadcn `Tabs`, and none of them imports a plugin: `client/pages/auth/` wires each form to `@nocobase/app-plugin-authentication/client/actions`, passes translated labels from `client/locales/` (the `auth.*` keys now live there directly), and keeps the NocoBase brand panel as the layout's aside. Routes, redirects, the sign-up switch and error messages behave as before. The templates gain the shadcn `alert`, `field`, `input-group`, `tabs` and `textarea` primitives.

An application generated earlier keeps working with its own `client/extensions/nocobase-auth-ui/`. To follow, install `@nocobase/auth-forms`, `@nocobase/auth-methods` and `@nocobase/auth-split-layout`, rewrite `client/pages/auth/` after the template's pages, move the `auth.*` keys from the block's `locales/` into `client/locales/`, and delete the old directory.
