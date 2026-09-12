# File Preview

In interfaces containing file fields (including attachment fields), you can preview files by clicking on the file thumbnail or icon. The built-in preview function supports various file types, including images, PDFs, and most file types natively supported by browsers.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

For file types that do not support native preview, you can enable preview functionality by installing or extending the corresponding file preview plugins. For example, after installing the Office File Preview plugin, you can preview Word, Excel, and PowerPoint files.

Currently, NocoBase provides the following file preview plugins:

- [Office File Preview Plugin](./ms-office.md)

## PDF preview mechanism

NocoBase selects the PDF preview method according to whether the file URL has the same origin as the current page:

| File URL | Common storage type | Preview method | CORS requirement |
| --- | --- | --- | --- |
| Same origin as NocoBase | Local storage | NocoBase reads the file and renders it with the built-in PDF.js viewer | No cross-origin CORS involved |
| Cross-origin | Third-party storage such as OSS, S3, COS, or a CDN | The browser opens the file URL in an iframe | The iframe preview itself does not require CORS |

:::tip What determines the preview method

The preview method depends on whether the file URL is same-origin, not directly on the storage engine name. Local storage served from a separate file domain is treated as cross-origin. Third-party storage accessed through a same-origin NocoBase proxy is treated as same-origin.

:::

### Local storage or a same-origin URL

Local storage URLs usually start with `/storage/uploads/` and have the same origin as the NocoBase page. During preview, NocoBase reads the PDF data and passes it to the built-in PDF.js viewer to render pages and text.

This method does not depend on the browser's built-in PDF reader. Even if the file response uses `Content-Disposition: attachment` for security, NocoBase can still read and render the file in the preview component. The file URL must remain accessible with the current login state.

### Third-party storage or a cross-origin URL

Third-party storage such as OSS, S3, COS, and CDNs usually uses a separate domain. NocoBase places this PDF URL in an iframe, so the browser and the storage service's response headers determine the result.

To open a PDF in the iframe, the storage service should normally return `Content-Type: application/pdf` and must not force a download with `Content-Disposition: attachment`. If the response requests a download, the browser downloads the file directly and NocoBase cannot override that behavior in the frontend.

Loading a cross-origin PDF in an iframe does not itself require CORS. However, the download button in the preview component reads the file with `fetch` and creates a Blob, so cross-origin downloads still require the storage service to allow CORS requests from the NocoBase site.

### Notes for Aliyun OSS

In some cases, the default Aliyun OSS domain forces a download by returning `Content-Disposition: attachment` and `x-oss-force-download: true`. Images may still preview normally, while a PDF placed in an iframe is downloaded.

You can usually resolve this by binding a custom domain to the bucket and configuring NocoBase to access files through that domain. See [Aliyun OSS troubleshooting](../storage/aliyun-oss.md#common-issues) for configuration and diagnostic steps.

### Security boundary for cross-origin previews

Some browsers or PDF readers may support scripts, forms, or other interactive content inside PDF files. If the previewed file comes from an untrusted source, pay attention to the security boundary for script execution.

We recommend isolating the file access domain from the NocoBase site and API domains. For example, serve files from OSS, S3, COS, or a CDN through a dedicated domain, instead of sharing the same origin with the NocoBase frontend or API.

If the file domain is different from the API domain, and the API does not enable CORS access for the file domain, scripts running in the PDF preview environment are usually restricted by the browser's same-origin policy. They cannot directly read the NocoBase page, browser storage, or API responses.

## Related links

- [Office File Preview Plugin](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
