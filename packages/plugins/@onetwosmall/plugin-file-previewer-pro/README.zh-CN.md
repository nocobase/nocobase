# 文件预览增强插件

一个为 NocoBase 提供增强文件预览功能的插件，支持多种预览模式，适用于 Office 文档和其他文件格式。

## 功能特性

- **三种预览模式**：在微软在线预览、kkFileView 和 BaseMetas 之间切换
  - **微软在线预览**：原生支持 Office 文档（DOCX、XLSX、PPTX、ODT）
  - **kkFileView**：通用文件格式支持，包括压缩文件、CAD 图纸等
  - **BaseMetas**：自托管的文件预览服务
- **自定义扩展名**：可指定使用特定服务强制预览的文件扩展名
- **混合内容检测**：当 HTTPS 站点尝试加载 HTTP 预览内容时发出警告
- **文件大小限制**：超大文件（>30MB）阻止预览并建议下载
- **灵活配置**：在管理员设置中轻松切换预览模式
- **自定义服务器**：支持自定义 kkFileView 或 BaseMetas 服务器部署
- **安全 URL 编码**：kkFileView 使用 Base64 + URI 编码方式保护 URL

## 安装

```bash
yarn add @onetwosmall/plugin-file-previewer-pro
```

## 配置

### 管理员设置

导航到 **设置 → 插件 → File Previewer Pro** 进行配置。

#### 预览模式选择

**微软在线模式**（默认）
- 使用微软官方 Office 在线查看器
- 支持：DOCX、XLSX、PPTX、ODT 文件
- 需要文件可在公网访问
- 无需额外设置

**kkFileView 模式**
- 使用 kkFileView 服务器进行通用文件预览
- 支持：所有文件格式（Office 文档、PDF、图片、视频、压缩文件、CAD 图纸等）
- 需要运行 kkFileView 服务器

**BaseMetas 模式**
- 使用 BaseMetas 服务器进行文件预览
- 支持：所有文件格式（Office 文档、PDF、图片、视频、压缩文件、CAD 图纸等）
- 需要运行 BaseMetas 服务器

#### 自定义扩展名

可以指定自定义文件扩展名，强制使用 kkFileView 或 BaseMetas 预览。如果留空，将使用默认的支持列表（Office、PDF、文本、代码等）。

### 配置 kkFileView 服务器

使用 kkFileView 模式时，需要提供服务器 URL：

1. 进入 **设置 → 插件 → File Previewer Pro**
2. 选择 **KKFileView** 作为预览模式
3. 输入 kkFileView 服务器 URL（默认：`http://localhost:8012`）
4. 可选：指定使用 kkFileView 的自定义扩展名
5. 点击 **保存**

#### kkFileView 服务器部署

**使用 Docker（推荐）**

```bash
docker run -d \
  --name kkfileview \
  -p 8012:8012 \
  keking/kkfileview:latest
```

**下载并运行**

1. 从以下地址下载：https://gitee.com/kekingcn/file-online-preview/releases
2. 解压并运行：
   ```bash
   java -jar kkfileview-x.x.x.jar
   ```

### 配置 BaseMetas 服务器

使用 BaseMetas 模式时：

1. 进入 **设置 → 插件 → File Previewer Pro**
2. 选择 **BaseMetas** 作为预览模式
3. 输入 BaseMetas 服务器 URL（默认：`http://localhost:9000`）
4. 可选：指定使用 BaseMetas 的自定义扩展名
5. 点击 **保存**

## 使用方法

### 终端用户

1. 向 NocoBase 集合（附件字段）上传文件
2. 点击文件进行预览
   - **微软模式**：只能预览 Office 文档（DOCX、XLSX、PPTX、ODT）
   - **kkFileView/BaseMetas 模式**：支持所有文件类型预览

### 开发者

插件通过文件管理器插件的 `filePreviewTypes` API 自动注册文件预览：

```typescript
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

filePreviewTypes.add({
  match: (file) => shouldPreviewFile(file, config),
  Previewer: OfficeInlinePreviewer,
});
```

## 功能对比

| 功能 | 微软在线 | kkFileView | BaseMetas |
|------|--------|-----------|-----------|
| 需要设置 | 否 | 是（需要外部服务器）| 是（需要外部服务器）|
| 支持的格式 | 仅 Office（DOCX、XLSX、PPTX、ODT）| 所有格式 | 所有格式 |
| CAD 文件（DWG、DXF）| 否 | 是 | 是 |
| PDF | 否 | 是 | 是 |
| 图片 | 否 | 是 | 是 |
| 视频 | 否 | 是 | 是 |
| 压缩文件 | 否 | 是 | 是 |
| Office 文档 | 是 | 是 | 是 |
| 需要公网 | 是 | 否 | 否 |
| 隐私性 | 云端 | 自主托管 | 自主托管 |

## kkFileView 的 URL 编码

使用 kkFileView 预览文件时，URL 会自动使用以下方式编码：

```
Base64 编码 → URI 编码 → 查询参数
```

预览 URL 格式示例：
```
http://your-kkfileview-server:8012/onlinePreview?url=<encoded-url>
```

## 故障排除

### "kkFileView URL 未配置" 错误

- 检查是否在插件设置中设置了 kkFileView 服务器 URL
- 确保 kkFileView 服务器正在运行且可访问

### "混合内容" 警告

- 当前站点使用 HTTPS 但预览服务（kkFileView/BaseMetas）使用 HTTP 时会出现
- 请将预览服务配置为 HTTPS，或使用反向代理

### "文件过大" 提示

- 大于 30MB 的文件会提示下载而不是预览
- 这是为了避免大文件导致浏览器性能问题

### 文件无法显示预览

**在微软模式下：**
- 只支持 DOCX、XLSX、PPTX、ODT 文件
- 文件需要可被公网访问（非本地/内网环境）

**在 kkFileView/BaseMetas 模式下：**
- 确保预览服务器正在运行
- 检查服务器 URL 是否正确且可访问
- 验证文件 URL 是否能被预览服务器访问

## 支持的文件格式

### 微软在线模式
- Word 文档：`.docx`
- Excel 电子表格：`.xlsx`
- PowerPoint 演示文稿：`.pptx`
- 开放文档文本：`.odt`

### kkFileView / BaseMetas 模式
- **文档**：DOCX、XLSX、PPTX、PDF、ODT、DOC、XLS、PPT、WPS、PAGES
- **图片**：JPG、JPEG、PNG、GIF、BMP、WEBP、SVG、TIFF
- **视频**：MP4、AVI、MOV、MKV、FLV、WMV、WebM
- **压缩文件**：ZIP、RAR、7Z、TAR、GZ、BZIP2
- **CAD**：DWG、DXF、STEP、IGS
- **代码**：JS、CSS、HTML、XML、JSON、SQL、JAVA、PYTHON 等
- **文本**：TXT、MD、CSV

## 更新日志

### v2.1.0-beta.9
- 插件从 `plugin-file-previewer-office` 重命名为 `plugin-file-previewer-pro`
- 新增 BaseMetas 预览模式支持
- 新增自定义扩展名配置
- 新增混合内容检测及警告
- 新增文件大小限制（30MB）及下载提示
- 修复 i18n 命名空间，正确加载中文翻译

### v2.1.0-beta.5
- 修复了在某些预览模式下下载按钮失效的问题，改为使用本地实现的 `saveAs` 下载。
- 修复了下载文件时以及向外部预览器（如 BaseMetas `fileName` 传参时）由于文件名重复拼接导致出现双后缀（例如 `file.pdf.pdf`）的问题。

## 许可证

本项目采用双许可证模式：AGPL-3.0 和 NocoBase 商业许可证。

更多信息请访问：https://www.nocobase.com/agreement
