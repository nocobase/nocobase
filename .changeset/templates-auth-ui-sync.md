---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

`client/extensions/nocobase-auth-ui/` now holds exactly the files the UI Library's `auth-ui` installs, and `tests/scripts/template-ui-library.test.mjs` keeps it that way. Its relative imports carry the `.js` extension, it ships its `locales/`, which `client/locales/en-US.ts` and `zh-CN.ts` spread ahead of the application's own keys in `messages` instead of repeating them, and the out-of-date `README.md` the templates kept beside it is gone. No wording changes, and `PasswordLoginForm` still shows the sign-up link only while `useSignUpAvailable()` allows it. The development Skill's copy reference describes the new layout, and its steps for adding a language now translate the sign-in pages' copy too.

An application generated earlier keeps working as it is. To follow, merge the new `client/extensions/nocobase-auth-ui/` into its own copy, `locales/` included, keeping its own changes, and in `client/locales/` replace the `auth.*` keys the block provides with a spread of its locale files, as the [block's README](https://github.com/nocobase/nocobase3/blob/develop/ui-library/registry/auth/auth-ui/README.md#translations) shows. Keep the application's own `auth.*` keys, such as `auth.welcome`, which the block does not provide. Its `client/extensions/nocobase-auth-ui/README.md` can be deleted.
