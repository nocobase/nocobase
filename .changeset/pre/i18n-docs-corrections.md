---
'@nocobase/i18n': patch
'@nocobase/app-plugin-i18n': patch
'@nocobase/app-skills': patch
---

Correct the i18n documentation and extend the `nocobase-app-plugin-i18n` Skill

The `@nocobase/i18n` README called `getFixedT` with the locale first; it takes the namespace first, `getFixedT(namespace, locale)`, and the other order silently returns an unusable translator. It also no longer describes `@nocobase/i18n` as shipping built-in common terms: `BASE_NAMESPACE` stays in the fallback chain but carries no resources. The `nocobase-app-plugin-i18n` Skill drops the `refine.addResources` `meta.i18nNs` menu labels, which nothing reads any more, in favour of `navigation.title` and `breadcrumb.title` keys on `defineAppRoutes`; fixes the language switcher path and the name of `createAppI18nRuntime`; and adds how to wire a package's locales for the first time, how to translate on the server inside and outside a request, and how to throw an `AppI18nError`. Its description now says which work belongs to `nocobase-app-development` and `nocobase-plugin-development`. The `nocobase-app-development` Skill states that its examples use `actions.create`, `actions.saving` and `actions.discard`, which the templates do not define, so they must be added before an example is copied.
