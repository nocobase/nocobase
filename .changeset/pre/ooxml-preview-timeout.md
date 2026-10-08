---
'@nocobase/app-plugin-file': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-template-default': patch
---

Fix the Office Open XML (`.docx`, `.xlsx`, `.pptx`) file preview staying on "Loading preview..." indefinitely when the file request or the renderer never settles. The preview now gives up after 3 minutes, aborts the request, destroys the Viewer, and shows a timeout message with the download fallback. Applications that materialized the `component-ui` Registry item can pick up the fix by materializing it again.
