---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Show only the brand loading mark before the client starts, so a non-English application no longer flashes "Loading application…" in English. Screen readers perceive it as a progress bar named after the brand, announced in their own language, until the localized loading appears. Existing applications can apply the same change to their own `index.html`.
