---
'@nocobase/app-plugin-file': patch
'@nocobase/app-template-default': patch
'@nocobase/app-plugin-file-example': patch
---

The PDF preview, in the Registry components and the file example, now embeds the fetched file as `application/pdf` and refuses an HTML, SVG or XML response. A blob URL takes the App's origin, so this keeps markup from an external content URL from running there. A PDF served as `application/octet-stream` now previews instead of downloading. The file Skill's preview checklist now covers PDF.
