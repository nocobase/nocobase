# Office 文件预览插件

一个为 NocoBase 提供强大且灵活的文件预览功能的插件，支持多种预览模式，适用于 Office 文档和其他文件格式。

## 功能特性

- **双预览模式**：在微软在线预览和 kkFileView 之间切换
  - **微软在线预览**：原生支持 Office 文档（DOCX、XLSX、PPTX、ODT）
  - **kkFileView**：通用文件格式支持，包括压缩文件、CAD 图纸等
- **灵活配置**：在管理员设置中轻松切换预览模式
- **自定义 kkFileView 服务器**：支持自定义 kkFileView 服务器部署
- **安全 URL 编码**：kkFileView 使用 Base64 + URI 编码方式保护 URL

## 安装

```bash
yarn add @nocobase/plugin-file-previewer-office
```

## 配置

### 管理员设置

导航到 **设置 → 插件 → Office 文件预览器** 进行配置。

#### 预览模式选择

**微软在线模式**（默认）
- 使用微软官方 Office 在线查看器
- 支持：DOCX、XLSX、PPTX、ODT 文件
- 只有这些文件类型可以预览
- 无需额外设置

**kkFileView 模式**
- 使用 kkFileView 服务器进行通用文件预览
- 支持：所有文件格式（Office 文档、PDF、图片、视频、压缩文件、CAD 图纸等）
- 启用此模式时，**自动处理所有文件类型**
- 需要运行 kkFileView 服务器

### 配置 kkFileView 服务器

使用 kkFileView 模式时，需要提供服务器 URL：

1. 进入 **设置 → 插件 → Office 文件预览器**
2. 选择 **KKFileView** 作为预览模式
3. 输入 kkFileView 服务器 URL（默认：`http://localhost:8012`）
4. 点击 **保存**

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

## 使用方法

### 终端用户

1. 向 NocoBase 集合（附件字段）上传文件
2. 点击文件进行预览
   - **微软模式**：只能预览 Office 文档（DOCX、XLSX、PPTX、ODT）
   - **kkFileView 模式**：支持所有文件类型预览

### 开发者

插件会自动注册文件预览。在 kkFileView 模式下，它会接管所有文件类型：

```typescript
// 示例：DWG 文件（CAD 图纸）仅在 kkFileView 模式下预览
// 在微软模式下，会显示默认文件查看器
// 在 kkFileView 模式下，会自动预览
```

## 功能对比

| 功能 | 微软在线 | kkFileView |
|------|--------|-----------|
| 需要设置 | 否 | 是（需要外部服务器）|
| 支持的格式 | 仅 Office（DOCX、XLSX、PPTX、ODT）| 所有格式 |
| CAD 文件（DWG、DXF）| ❌ | ✅ |
| PDF | ❌ | ✅ |
| 图片 | ❌ | ✅ |
| 视频 | ❌ | ✅ |
| 压缩文件 | ❌ | ✅ |
| Office 文档 | ✅ | ✅ |
| 隐私性 | 云端 | 自主托管 |

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

### 文件无法显示预览

**在微软模式下：**
- 只支持 DOCX、XLSX、PPTX、ODT 文件
- 其他格式会使用默认文件查看器

**在 kkFileView 模式下：**
- 确保 kkFileView 服务器正在运行
- 检查服务器 URL 是否正确且可访问
- 验证文件 URL 是否正确格式化

## 支持的文件格式

### 微软在线模式
- Word 文档：`.docx`
- Excel 电子表格：`.xlsx`
- PowerPoint 演示文稿：`.pptx`
- 开放文档文本：`.odt`

### kkFileView 模式
- **文档**：DOCX、XLSX、PPTX、PDF、ODT、DOC、XLS、PPT、WPS、PAGES
- **图片**：JPG、JPEG、PNG、GIF、BMP、WEBP、SVG、TIFF
- **视频**：MP4、AVI、MOV、MKV、FLV、WMV、WebM
- **压缩文件**：ZIP、RAR、7Z、TAR、GZ、BZIP2
- **CAD**：DWG、DXF、STEP、IGS
- **代码**：JS、CSS、HTML、XML、JSON、SQL、JAVA、PYTHON 等
- **文本**：TXT、MD、CSV

## 许可证

本项目采用双许可证模式：AGPL-3.0 和 NocoBase 商业许可证。

更多信息请访问：https://www.nocobase.com/agreement
