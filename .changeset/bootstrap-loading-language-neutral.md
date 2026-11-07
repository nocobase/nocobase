---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Show only the brand loading mark before the client starts, so a non-English application no longer flashes "Loading application…" in English and screen readers no longer hear an English label before the localized loading appears. Existing applications can apply the same change to their own `index.html`.
