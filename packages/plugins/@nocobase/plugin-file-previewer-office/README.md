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
# NocoBase

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/4d11a87b-00e2-48f3-9bf7-389d21072d13" type="video/mp4">
</video>

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## What is NocoBase

NocoBase is the most extensible AI-powered no-code platform.   
Total control. Infinite extensibility. AI collaboration.  
Enable your team to adapt quickly and cut costs dramatically.  
No years of development. No millions wasted.  
Deploy NocoBase in minutes — and take control of everything.

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/

Use Cases:  
https://www.nocobase.com/en/blog/tags/customer-stories

## Release Notes

Our [blog](https://www.nocobase.com/en/blog/timeline) is regularly updated with release notes and provides a weekly summary.

## Distinctive features

### 1. Data model-driven, not form/table–driven

Instead of being constrained by forms or tables, NocoBase adopts a data model–driven approach, separating data structure from user interface to unlock unlimited possibilities.

- UI and data structure are fully decoupled
- Multiple blocks and actions can be created for the same table or record in any quantity or form
- Supports the main database, external databases, and third-party APIs as data sources

![model](https://static-docs.nocobase.com/model.png)

### 2. AI employees, integrated into your business systems
Unlike standalone AI demos, NocoBase allows you to embed AI capabilities seamlessly into your interfaces, workflows, and data context, making AI truly useful in real business scenarios.

- Define AI employees for roles such as translator, analyst, researcher, or assistant
- Seamless AI–human collaboration in interfaces and workflows
- Ensure AI usage is secure, transparent, and customizable for your business needs

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

### 3. What you see is what you get, incredibly easy to use

While enabling the development of complex business systems, NocoBase keeps the experience simple and intuitive.

- One-click switch between usage mode and configuration mode
- Pages serve as a canvas to arrange blocks and actions, similar to Notion
- Configuration mode is designed for ordinary users, not just programmers

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 4. Everything is a plugin, designed for extension
Adding more no-code features will never cover every business case. NocoBase is built for extension through its plugin-based microkernel architecture.

- All functionalities are plugins, similar to WordPress
- Plugins are ready to use upon installation
- Pages, blocks, actions, APIs, and data sources can all be extended through custom plugins

![plugins](https://static-docs.nocobase.com/plugins.png)

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Installing With Docker (👍Recommended)</a>

  Suitable for no-code scenarios, no code to write. When upgrading, just download the latest image and reboot.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Installing from create-nocobase-app CLI</a>

  The business code of the project is completely independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Installing from Git source code</a>

  If you want to experience the latest unreleased version, or want to participate in the contribution, you need to make changes and debug on the source code, it is recommended to choose this installation method, which requires a high level of development skills, and if the code has been updated, you can git pull the latest code.

## How NocoBase works

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/8d183b44-9bb5-4792-b08f-bc08fe8dfaaf" type="video/mp4">
</video>
