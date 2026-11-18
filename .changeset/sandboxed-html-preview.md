---
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-template-default': patch
---

Preview HTML files in the file preview: `.html`/`.htm` and `text/html` files render in a script-only sandboxed frame whose Content Security Policy blocks every request, with a Source tab for the markup. SVG, XML and XHTML still only download. Applications that installed `@nocobase/file-component-ui` reconcile the updated item, which now also needs the `tabs` primitive.
