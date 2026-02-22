# Office File Previewer Plugin

A powerful and flexible file preview plugin for NocoBase that supports multiple preview modes for office documents and other file formats.

## Features

- **Dual Preview Modes**: Switch between Microsoft Online Preview and kkFileView
  - **Microsoft Online**: Built-in support for Office documents (DOCX, XLSX, PPTX, ODT)
  - **kkFileView**: Universal file format support including compressed files, drawings, and more
- **Flexible Configuration**: Easily switch between preview modes in the admin settings
- **Custom kkFileView Server**: Support for custom kkFileView server deployment
- **Secure URL Encoding**: URLs are encoded using Base64 + URI encoding for kkFileView

## Installation

```bash
yarn add @nocobase/plugin-file-previewer-office
```

## Configuration

### Admin Settings

Navigate to **Settings → Plugins → Office File Previewer** to configure the plugin.

#### Preview Mode Selection

**Microsoft Online Mode** (Default)
- Uses Microsoft's official Office Online viewer
- Supports: DOCX, XLSX, PPTX, ODT files
- Only these file types can be previewed
- No additional setup required

**kkFileView Mode**
- Uses kkFileView server for universal file preview
- Supports: All file formats (Office documents, PDFs, images, videos, compressed files, CAD drawings, etc.)
- **All file types** are automatically handled when this mode is enabled
- Requires a running kkFileView server

### Configuring kkFileView Server

When using kkFileView mode, you need to provide the server URL:

1. Go to **Settings → Plugins → Office File Previewer**
2. Select **KKFileView** as the preview mode
3. Enter the kkFileView server URL (default: `http://localhost:8012`)
4. Click **Save**

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

## Usage

### For End Users

1. Upload a file to your NocoBase collection (attachment field)
2. Click on the file to preview it
   - In **Microsoft mode**: Only Office documents (DOCX, XLSX, PPTX, ODT) can be previewed
   - In **kkFileView mode**: All file types are supported for preview

### For Developers

The plugin automatically registers file previews. In kkFileView mode, it intercepts all file types:

```typescript
// Example: DWG files (CAD drawings) are only previewed in kkFileView mode
// In Microsoft mode, they would show the default file viewer
// In kkFileView mode, they are automatically previewed
```

## Comparison

| Feature | Microsoft Online | kkFileView |
|---------|------------------|-----------|
| Setup Required | No | Yes (external server) |
| Supported Formats | Office only (DOCX, XLSX, PPTX, ODT) | All formats |
| CAD Files (DWG, DXF) | ❌ | ✅ |
| PDF | ❌ | ✅ |
| Images | ❌ | ✅ |
| Videos | ❌ | ✅ |
| Compressed Files | ❌ | ✅ |
| Office Documents | ✅ | ✅ |
| Privacy | Cloud-based | Self-hosted |

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

### Files not showing preview

**In Microsoft mode:**
- Only DOCX, XLSX, PPTX, ODT files are supported
- Other formats will use the default file viewer

**In kkFileView mode:**
- Ensure kkFileView server is running
- Check that the server URL is correct and accessible
- Verify the file URL is properly formatted

## Supported File Formats

### Microsoft Online Mode
- Word Documents: `.docx`
- Excel Spreadsheets: `.xlsx`
- PowerPoint Presentations: `.pptx`
- Open Document Text: `.odt`

### kkFileView Mode
- **Documents**: DOCX, XLSX, PPTX, PDF, ODT, DOC, XLS, PPT, WPS, PAGES
- **Images**: JPG, JPEG, PNG, GIF, BMP, WEBP, SVG, TIFF
- **Videos**: MP4, AVI, MOV, MKV, FLV, WMV, WebM
- **Archives**: ZIP, RAR, 7Z, TAR, GZ, BZIP2
- **CAD**: DWG, DXF, STEP, IGS
- **Code**: JS, CSS, HTML, XML, JSON, SQL, JAVA, PYTHON, etc.
- **Text**: TXT, MD, CSV

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.

For more information, please refer to: https://www.nocobase.com/agreement
