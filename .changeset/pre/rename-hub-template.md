---
'@nocobase/app-cli': patch
---

Rename the Hub template package from `@nocobase/hub` to `@nocobase/app-template-hub`, so it matches the naming the other v3 templates already use and reads as the template it is rather than as the Hub runtime itself.

This is a breaking rename with no compatibility shim: `@nocobase/hub` will not receive further releases, and nothing is published under the old name from here on. The new package starts its version history over rather than continuing the old one, so a dependency on `@nocobase/hub` has to be repointed by hand. `nb3 hub create` now defaults to the new package, which means an older `nb3` still downloads the old name and pins whatever `@nocobase/hub@beta` last resolved to.
