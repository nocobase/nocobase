# File Preview

In interfaces containing file fields (including attachment fields), you can preview files by clicking on the file thumbnail or icon. The built-in preview function supports various file types, including images, PDFs, and most file types natively supported by browsers.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

For file types that do not support native preview, you can enable preview functionality by installing or extending the corresponding file preview plugins. For example, after installing the Office File Preview plugin, you can preview Word, Excel, and PowerPoint files.

Currently, NocoBase provides the following file preview plugins:

* [Office File Preview Plugin](../file-preview/ms-office.md)

## PDF preview with external storage

PDF preview uses PDF.js to render files in the browser. The browser must first read the PDF file content and then pass it to PDF.js for rendering. Therefore, when files are stored in external storage such as OSS, S3, COS, or a CDN, and the file access domain is different from the NocoBase site domain, the external storage must allow the NocoBase site to read files across origins.

If CORS is not configured, PDF downloads can still work normally, but preview may fail with a file loading error.

The CORS configuration for external storage or CDN should include:

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` should be set to the actual domain used to access NocoBase. Avoid using `*` for non-public files over the long term, because it expands the range of sites that can read the files.
