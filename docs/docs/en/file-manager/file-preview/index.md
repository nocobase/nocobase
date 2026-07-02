# File Preview

In interfaces containing file fields (including attachment fields), you can preview files by clicking on the file thumbnail or icon. The built-in preview function supports various file types, including images, PDFs, and most file types natively supported by browsers.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

For file types that do not support native preview, you can enable preview functionality by installing or extending the corresponding file preview plugins. For example, after installing the Office File Preview plugin, you can preview Word, Excel, and PowerPoint files.

Currently, NocoBase provides the following file preview plugins:

* [Office File Preview Plugin](../file-preview/ms-office.md)

## PDF preview with external storage

NocoBase previews PDFs through a browser iframe. Some browsers or PDF readers may support scripts, forms, or other interactive content inside PDF files. If the previewed file comes from an untrusted source, pay attention to the security boundary for script execution.

We recommend isolating the file access domain from the NocoBase site and API domains. For example, serve files from OSS, S3, COS, or a CDN through a dedicated domain, instead of sharing the same origin with the NocoBase frontend or API.

If the file domain is different from the API domain, and the API does not enable CORS access for the file domain, scripts running in the PDF preview environment are usually restricted by the browser's same-origin policy. They cannot directly read the NocoBase page, browser storage, or API responses.
