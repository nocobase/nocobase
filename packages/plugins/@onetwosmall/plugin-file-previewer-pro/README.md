# File Previewer Pro Plugin

An enhanced file preview plugin for NocoBase that supports multiple preview modes for office documents and other file formats.

## Features

- **Three Preview Modes**: Switch between Microsoft Online, kkFileView, and BaseMetas
  - **Microsoft Online**: Built-in support for Office documents (DOCX, XLSX, PPTX, ODT)
  - **kkFileView**: Universal file format support including compressed files, drawings, and more
  - **BaseMetas**: Self-hosted file preview service
- **Custom Extensions**: Specify which file extensions to force preview with a specific service
- **Mixed Content Detection**: Warns when HTTPS site tries to load HTTP preview content
- **File Size Limit**: Prevents preview of oversized files (>30MB) with a download suggestion
- **Flexible Configuration**: Easily switch between preview modes in the admin settings
- **Custom Server Support**: Support for custom kkFileView or BaseMetas server deployment
- **Secure URL Encoding**: URLs are encoded using Base64 + URI encoding for kkFileView

## Installation

```bash
yarn add @onetwosmall/plugin-file-previewer-pro
```

## Configuration

### Admin Settings

Navigate to **Settings → Plugins → File Previewer Pro** to configure the plugin.

#### Preview Mode Selection

**Microsoft Online Mode** (Default)
- Uses Microsoft's official Office Online viewer
- Supports: DOCX, XLSX, PPTX, ODT files
- Requires the file to be publicly accessible on the internet
- No additional setup required

**kkFileView Mode**
- Uses kkFileView server for universal file preview
- Supports: All file formats (Office documents, PDFs, images, videos, compressed files, CAD drawings, etc.)
- Requires a running kkFileView server

**BaseMetas Mode**
- Uses BaseMetas server for file preview
- Supports: All file formats (Office documents, PDFs, images, videos, compressed files, CAD drawings, etc.)
- Requires a running BaseMetas server

#### Custom Extensions

You can specify custom file extensions to force preview with kkFileView or BaseMetas. If left empty, a default safe list (Office, PDF, Text, Code) will be used.

### Configuring kkFileView Server

When using kkFileView mode, you need to provide the server URL:

1. Go to **Settings → Plugins → File Previewer Pro**
2. Select **KKFileView** as the preview mode
3. Enter the kkFileView server URL (default: `http://localhost:8012`)
4. Optionally, specify custom extensions to use with kkFileView
5. Click **Save**

#### kkFileView Server Setup

**Using Docker (Recommended)**

```bash
docker run -d \
  --name kkfileview \
  -p 8012:8012 \
  keking/kkfileview:latest
```

**Download and Run**

1. Download from: https://gitee.com/kekingcn/file-online-preview/releases
2. Extract and run:
   ```bash
   java -jar kkfileview-x.x.x.jar
   ```

### Configuring BaseMetas Server

When using BaseMetas mode:

1. Go to **Settings → Plugins → File Previewer Pro**
2. Select **BaseMetas** as the preview mode
3. Enter the BaseMetas server URL (default: `http://localhost:9000`)
4. Optionally, specify custom extensions to use with BaseMetas
5. Click **Save**

## Usage

### For End Users

1. Upload a file to your NocoBase collection (attachment field)
2. Click on the file to preview it
   - In **Microsoft mode**: Only Office documents (DOCX, XLSX, PPTX, ODT) can be previewed
   - In **kkFileView/BaseMetas mode**: All file types are supported for preview

### For Developers

The plugin automatically registers file previews via the file-manager plugin's `filePreviewTypes` API:

```typescript
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

filePreviewTypes.add({
  match: (file) => shouldPreviewFile(file, config),
  Previewer: OfficeInlinePreviewer,
});
```

## Comparison

| Feature | Microsoft Online | kkFileView | BaseMetas |
|---------|------------------|------------|-----------|
| Setup Required | No | Yes (external server) | Yes (external server) |
| Supported Formats | Office only (DOCX, XLSX, PPTX, ODT) | All formats | All formats |
| CAD Files (DWG, DXF) | No | Yes | Yes |
| PDF | No | Yes | Yes |
| Images | No | Yes | Yes |
| Videos | No | Yes | Yes |
| Compressed Files | No | Yes | Yes |
| Office Documents | Yes | Yes | Yes |
| Public Network Required | Yes | No | No |
| Privacy | Cloud-based | Self-hosted | Self-hosted |

## URL Encoding for kkFileView

When previewing files with kkFileView, URLs are automatically encoded using:

```
Base64 encode → URI encode → Query parameter
```

Example preview URL format:
```
http://your-kkfileview-server:8012/onlinePreview?url=<encoded-url>
```

## Troubleshooting

### "kkFileView URL not configured" Error

- Check that you have set a kkFileView server URL in the plugin settings
- Ensure the kkFileView server is running and accessible

### "Mixed Content" Warning

- This appears when your site uses HTTPS but the preview service (kkFileView/BaseMetas) is HTTP
- Configure your preview service to use HTTPS, or use a reverse proxy

### "File too large" Message

- Files larger than 30MB will show a download prompt instead of preview
- This prevents browser performance issues with large files

### Files not showing preview

**In Microsoft mode:**
- Only DOCX, XLSX, PPTX, ODT files are supported
- Files must be publicly accessible (not local/private network)

**In kkFileView/BaseMetas mode:**
- Ensure the preview server is running
- Check that the server URL is correct and accessible
- Verify the file URL is accessible from the preview server

## Supported File Formats

### Microsoft Online Mode
- Word Documents: `.docx`
- Excel Spreadsheets: `.xlsx`
- PowerPoint Presentations: `.pptx`
- Open Document Text: `.odt`

### kkFileView / BaseMetas Mode
- **Documents**: DOCX, XLSX, PPTX, PDF, ODT, DOC, XLS, PPT, WPS, PAGES
- **Images**: JPG, JPEG, PNG, GIF, BMP, WEBP, SVG, TIFF
- **Videos**: MP4, AVI, MOV, MKV, FLV, WMV, WebM
- **Archives**: ZIP, RAR, 7Z, TAR, GZ, BZIP2
- **CAD**: DWG, DXF, STEP, IGS
- **Code**: JS, CSS, HTML, XML, JSON, SQL, JAVA, PYTHON, etc.
- **Text**: TXT, MD, CSV

## Changelog

### v2.1.0-beta.9
- Renamed plugin from `plugin-file-previewer-office` to `plugin-file-previewer-pro`
- Added BaseMetas preview mode support
- Added custom extensions configuration
- Added mixed content detection and warning
- Added file size limit (30MB) with download suggestion
- Fixed i18n namespace to correctly load translations

### v2.1.0-beta.5
- Fixed an issue where the download button failed to work under certain preview modes by implementing a local `saveAs` function.
- Fixed an issue where the downloaded file name and external previewer parameters (like BaseMetas `fileName`) incorrectly contained duplicated file extensions (e.g., `file.pdf.pdf`).

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.

For more information, please refer to: https://www.nocobase.com/agreement
