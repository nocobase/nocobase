---
pkg: '@nocobase/plugin-file-previewer-office'
---

# Office File Preview <Badge>v1.8.11+</Badge>

The Office File Preview plugin allows users to preview Office-format files, such as Word, Excel, and PowerPoint, directly within the NocoBase application.  
It leverages Microsoft's public online service to embed the file content into a preview interface, enabling users to view documents directly in the browser without downloading or using Office applications.

## User Guide

By default, this plugin is **disabled**. It can be enabled in the plugin manager and requires no additional configuration.

![Plugin activation interface](https://static-docs.nocobase.com/20250731140048.png)

After successfully uploading an Office file (Word / Excel / PowerPoint) to a file field in a data table, you can click the file icon or link to preview its content in a popup or embedded interface.

![Preview usage example](https://static-docs.nocobase.com/20250731143231.png)

## How It Works

This plugin uses Microsoft’s public online service (Office Web Viewer) to render previews. The basic workflow is as follows:

- The frontend generates a publicly accessible URL for the uploaded file (including signed URLs such as those from the S3-Pro plugin);
- The plugin embeds the preview in an iframe using the following format:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<public file URL>
  ```

- Microsoft’s service fetches the file from the URL, renders it, and returns a previewable page.

## Notes

- Since this plugin depends on Microsoft’s online service, ensure that your network connection is stable and that Microsoft services are accessible.
- Microsoft will access the file URL you provide, and the file content may be temporarily cached on their servers for rendering. This introduces potential privacy concerns — if you're concerned about this, it's recommended not to use this plugin for sensitive documents[^1].
- Files must be accessible via a public URL to be previewed. Normally, files uploaded to NocoBase will have public access links automatically generated (including signed URLs from the S3-Pro plugin). However, if access permissions are restricted or the file is stored in an internal network, it cannot be previewed[^2].
- This service does not support authentication or private storage. For example, files that require login or are only accessible on an internal network will not work with the preview functionality.
- After Microsoft retrieves the file, it may remain cached for a short period. Even if the source file is deleted, the preview might still be accessible for some time.
- Recommended file size limits: Word and PowerPoint files should be no larger than 10MB, and Excel files no larger than 5MB for reliable preview performance[^3].
- There is no official public statement regarding commercial usage of this service. Please assess the risks before using it in commercial applications[^4].

## Supported File Types

This plugin only supports previews for the following Office file formats, based on the file's MIME type or file extension:

- Word Document:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) or `application/msword` (`.doc`)
- Excel Spreadsheet:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) or `application/vnd.ms-excel` (`.xls`)
- PowerPoint Presentation:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) or `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument Text:
  `application/vnd.oasis.opendocument.text` (`.odt`)

Other file formats will not be previewed by this plugin.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
