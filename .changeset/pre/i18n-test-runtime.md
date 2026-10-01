---
'@nocobase/i18n': minor
---

Add `@nocobase/i18n/testing`, which builds a real i18n runtime from a package's own locale files for component tests. `createTestI18nRuntime` loads the resources before resolving, so the first render is already translated. By default it throws `MissingTranslationError` for a key the whole fallback chain lacks, even when a `defaultValue` would otherwise hide it. `TestI18nProvider` mounts the runtime with the same provider and namespace scope an application uses. Tests that mock `useTranslation` can move to it and assert on the shipped wording.
