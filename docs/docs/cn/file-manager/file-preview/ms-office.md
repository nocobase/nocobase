---
pkg: '@nocobase/plugin-file-previewer-office'
---

# Office 文件预览 <Badge>v1.8.11+</Badge>

Office 文件预览插件用于在 NocoBase 应用中预览 Office 格式的文件，如 Word、Excel、PowerPoint 等。  
它基于微软提供的公共在线服务，可将通过公开 URL 可访问的文件嵌入预览界面，用户可在浏览器中查看这些文件，无需下载或使用 Office 应用程序。

## 使用手册

默认情况下该插件处于 **未启用** 状态。在插件管理器中启用后即可使用，无需额外配置。

![插件启用界面](https://static-docs.nocobase.com/20250731140048.png)

在数据表的文件字段中上传 Office 文件（Word / Excel / PowerPoint）成功后，点击对应文件图标或链接，即可在弹出的或嵌入的预览界面中查看文件内容。

![预览操作示例](https://static-docs.nocobase.com/20250731143231.png)

## 实现原理

该插件嵌入的预览依赖微软的公共在线服务（Office Web Viewer），主要流程：

- 前端将用户上传的文件生成可公开访问的 URL（包括 S3 带签名 URL）；
- 插件在 iframe 中使用如下地址加载文件预览：

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<公开文件 URL>
  ```

- 微软服务会向该 URL 请求文件内容，加以渲染并返回可查看页面。

## 注意事项

- 由于该插件依赖于微软的在线服务，因此需要确保网络连接正常，并且能够访问微软的相关服务。
- 微软会访问你提供的文件 URL，文件内容会被其服务器短暂缓存，用于渲染预览页面，因此存在一定隐私风险，如果你对此有顾虑，建议不要使用该插件提供预览功能[^1]。
- 需要预览的文件必须是公开可访问的 URL。通常情况下，上传到 NocoBase 的文件会自动生成可访问的公开链接（包括 S3-Pro 插件生成的带签名 URL），但如果文件设置了访问权限或存储在内网环境中，则无法预览[^2]。
- 该服务不支持登录验证或私有存储的资源。例如，仅在内网可访问或需登录才能访问的文件无法使用该预览功能。
- 文件内容在被微软服务抓取后，可能在短时间内被缓存，即使源文件删除，预览内容也可能仍可访问一段时间。
- 文件大小有推荐限制：Word 和 PowerPoint 文件建议不超过 10MB，Excel 文件建议不超过 5MB，以确保预览稳定性[^3]。
- 该服务目前无官方明确的商业使用许可说明，使用上请自行评估风险[^4]。

## 支持的文件格式

插件仅支持以下 Office 文件格式的预览，判断依据为文件的 MIME 类型或文件扩展名：

- Word 文档：
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` （`.docx`）或 `application/msword`（`.doc`）
- Excel 表格：
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` （`.xlsx`）或 `application/vnd.ms-excel`（`.xls`）
- PowerPoint 演示文稿：
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` （`.pptx`）或 `application/vnd.ms-powerpoint`（`.ppt`）
- OpenDocument 文本：`application/vnd.oasis.opendocument.text`（`.odt`）

其他格式的文件将不会启用该插件的预览功能。

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
