/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDownloadFileName,
  getFallbackIcon,
  getFileFetchCredentials,
  getFileName,
  getPdfPreviewApiSrc,
  getPdfPreviewResourceOptions,
  getPdfPreviewWorkerSrc,
  getPermanentFilePreviewUrl,
  getPreviewThumbnailUrl,
  getPreviewFileUrl,
  isActiveContentFile,
  isSameOriginUrl,
  rememberLocalPreviewUrl,
  revokeLocalPreviewUrl,
  shouldUsePdfJsPreview,
  triggerFileDownload,
} from '../filePreviewTypes';

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('getDownloadFileName', () => {
  afterEach(() => {
    delete window.__webpack_public_path__;
    delete window['__nocobase_api_base_url__'];
    delete window.__nocobase_public_path__;
    delete window.__nocobase_modern_client_prefix__;
    delete window['__nocobase_dev_public_path__'];
    vi.restoreAllMocks();
    if (originalCreateObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', { value: originalCreateObjectURL, configurable: true });
    } else {
      delete (URL as any).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', { value: originalRevokeObjectURL, configurable: true });
    } else {
      delete (URL as any).revokeObjectURL;
    }
  });

  it('应为仅包含 URL 的文件推导出下载名，兼容 AttachmentURL 字段', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    expect(getDownloadFileName({ url: 'https://example.com/files/report.xlsx?token=1' })).toBe(
      '1700000000000_report.xlsx',
    );
  });

  it('应为缺少扩展名的 filename 补齐后缀', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    expect(
      getDownloadFileName({
        filename: 'avatar',
        extname: '.png',
        url: 'https://example.com/files/avatar.png',
      }),
    ).toBe('1700000000000_avatar.png');
  });

  it('不应重复追加已有扩展名', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    expect(
      getDownloadFileName({
        filename: 'contract.pdf',
        url: 'https://example.com/files/contract.pdf?download=1',
      }),
    ).toBe('1700000000000_contract.pdf');
  });

  it('应解码 URL 中的中文文件名', () => {
    expect(getFileName({ url: 'https://example.com/files/%E6%B5%8B%E8%AF%95.pdf?token=1' })).toBe('测试.pdf');
  });

  it('应识别主动内容文件类型', () => {
    expect(isActiveContentFile({ mimetype: 'image/svg+xml', url: 'https://example.com/files/logo.svg' })).toBe(true);
    expect(isActiveContentFile({ mimetype: 'application/pdf', url: 'https://example.com/files/report.pdf' })).toBe(
      true,
    );
    expect(isActiveContentFile({ mimetype: 'application/xml', url: 'https://example.com/files/payload.xml' })).toBe(
      true,
    );
    expect(isActiveContentFile({ filename: 'payload.xsl', url: 'https://example.com/files/payload.xsl' })).toBe(true);
    expect(isActiveContentFile({ filename: 'index.html', url: 'https://example.com/files/index.html' })).toBe(true);
    expect(isActiveContentFile({ mimetype: 'image/png', url: 'https://example.com/files/avatar.png' })).toBe(false);
  });

  it('主动内容文件应使用占位图而不是原始缩略图地址', () => {
    expect(getPreviewThumbnailUrl({ mimetype: 'image/svg+xml', url: 'https://example.com/files/logo.svg' })).toBe(
      '/file-placeholder/svg-200-200.png',
    );
  });

  it('文件占位图应优先使用版本化静态资源路径', () => {
    window.__webpack_public_path__ = '/console/dist/2.1.0/';
    window.__nocobase_public_path__ = '/console/admin/';

    expect(getFallbackIcon({ filename: 'report.pdf' })).toBe('/console/dist/2.1.0/file-placeholder/pdf-200-200.png');
  });

  it('未配置版本化静态资源路径时应使用应用 public path', () => {
    window.__nocobase_public_path__ = '/nocobase/v/';

    expect(getFallbackIcon({ filename: 'report.pdf' })).toBe('/nocobase/v/file-placeholder/pdf-200-200.png');
  });

  it('v1 开发路径不应覆盖配置的应用 public path', () => {
    window['__nocobase_dev_public_path__'] = '/';
    window.__webpack_public_path__ = '/';
    window.__nocobase_public_path__ = '/nocobase/';

    expect(getFallbackIcon({ filename: 'report.pdf' })).toBe('/nocobase/file-placeholder/pdf-200-200.png');
  });

  it('永久文件地址应根据记录文件名推断图片缩略图', () => {
    expect(
      getPreviewThumbnailUrl({
        filename: 'avatar.png',
        url: '/files/main/main/attachments/1',
        preview: '/files/main/main/attachments/1?preview=1',
      }),
    ).toBe('/files/main/main/attachments/1?preview=1');
  });

  it('外部 /files/ 地址不应被当作永久文件地址追加预览参数', () => {
    expect(getPermanentFilePreviewUrl('https://cdn.example.com/files/main/main/attachments/1.png')).toBe('');
  });

  it('显式配置的 API origin 下的永久文件地址应追加预览参数', () => {
    window['__nocobase_api_base_url__'] = 'https://api.example.com/api/';

    expect(getPermanentFilePreviewUrl('https://api.example.com/files/main/main/attachments/1.png')).toBe(
      'https://api.example.com/files/main/main/attachments/1.png?preview=1',
    );
  });

  it('上传项应根据 response 中的文件元数据生成图片缩略图', () => {
    expect(
      getPreviewThumbnailUrl({
        status: 'done',
        response: {
          extname: '.jpg',
          filename: 'icon-alexa-108-52map4.jpg',
          id: 22,
          local: true,
          mimetype: 'image/jpeg',
          preview: '/files/main/main/t_n6fvrknhqjr/22?preview=1',
          url: '/files/main/main/t_n6fvrknhqjr/22',
        },
      }),
    ).toBe('/files/main/main/t_n6fvrknhqjr/22?preview=1');
  });

  it('上传项应兼容 response.data 包裹的文件元数据', () => {
    expect(
      getPreviewThumbnailUrl({
        status: 'done',
        response: {
          data: {
            extname: '.jpg',
            filename: 'avatar.jpg',
            id: 23,
            local: true,
            mimetype: 'image/jpeg',
            preview: '/files/main/main/t_n6fvrknhqjr/23?preview=1',
            url: '/files/main/main/t_n6fvrknhqjr/23',
          },
        },
      }),
    ).toBe('/files/main/main/t_n6fvrknhqjr/23?preview=1');
  });

  it('永久文件地址应根据记录元数据推断非图片占位图', () => {
    expect(
      getPreviewThumbnailUrl({
        filename: 'report.pdf',
        url: '/files/main/main/attachments/2',
        preview: '/files/main/main/attachments/2?preview=1',
      }),
    ).toBe('/file-placeholder/pdf-200-200.png');

    expect(
      getPreviewThumbnailUrl({
        extname: '.xlsx',
        url: '/files/main/main/attachments/3.xlsx?preview=1',
      }),
    ).toBe('/file-placeholder/xlsx-200-200.png');
  });

  it('有 originFileObj 时应优先使用本地预览地址', () => {
    const originFileObj = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:nocobase-local-preview'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const file = {
      originFileObj,
      type: 'image/png',
      url: '/files/main/main/attachments/1',
      preview: '/files/main/main/attachments/1?preview=1',
    };

    expect(getPreviewFileUrl(file)).toBe('blob:nocobase-local-preview');
    expect(getPreviewThumbnailUrl(file)).toBe('blob:nocobase-local-preview');

    revokeLocalPreviewUrl(file);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:nocobase-local-preview');
  });

  it('上传完成后的服务端记录应复用已登记的本地预览地址', () => {
    const originFileObj = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:nocobase-uploaded-preview'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
    const record = {
      id: 2,
      mimetype: 'image/png',
      url: '/files/main/main/attachments/2',
      preview: '/files/main/main/attachments/2?preview=1',
    };

    rememberLocalPreviewUrl(record, {
      originFileObj,
      type: 'image/png',
    });

    expect(
      getPreviewThumbnailUrl({
        ...record,
        url: `${window.location.origin}${record.url}`,
        preview: `${window.location.origin}${record.preview}`,
      }),
    ).toBe('blob:nocobase-uploaded-preview');

    revokeLocalPreviewUrl(record);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:nocobase-uploaded-preview');
  });

  it('应识别同源和跨源文件地址', () => {
    expect(isSameOriginUrl('/storage/uploads/report.pdf')).toBe(true);
    expect(isSameOriginUrl(`${window.location.origin}/storage/uploads/report.pdf`)).toBe(true);
    expect(isSameOriginUrl('https://files.example.com/storage/uploads/report.pdf')).toBe(false);
  });

  it('永久文件 PDF 地址应根据存储类型选择 PDF.js 或 iframe', () => {
    expect(shouldUsePdfJsPreview('/storage/uploads/report.pdf')).toBe(true);
    expect(shouldUsePdfJsPreview(`${window.location.origin}/storage/uploads/report.pdf`)).toBe(true);
    expect(shouldUsePdfJsPreview('/files/main/main/attachments/1')).toBe(true);
    expect(shouldUsePdfJsPreview({ url: '/files/main/main/attachments/1', local: true })).toBe(true);
    expect(shouldUsePdfJsPreview({ url: '/files/main/main/attachments/1', local: false })).toBe(false);
    expect(shouldUsePdfJsPreview('https://files.example.com/storage/uploads/report.pdf')).toBe(false);
  });

  it('只有同源文件地址 fetch 才应带 cookie', () => {
    expect(getFileFetchCredentials('/files/main/main/attachments/1')).toBe('include');
    expect(
      getFileFetchCredentials(`${window.location.protocol}//${window.location.hostname}:14000/files/main/main/1`),
    ).toBe('same-origin');
    expect(
      getFileFetchCredentials(
        `${window.location.protocol}//${window.location.hostname}:14000/nocobase/files/main/main/1`,
      ),
    ).toBe('same-origin');
    expect(getFileFetchCredentials(`${window.location.protocol}//${window.location.hostname}:14000/storage/1`)).toBe(
      'same-origin',
    );
    expect(getFileFetchCredentials('https://files.example.com/files/main/main/1')).toBe('same-origin');
  });

  it('显式配置的 API origin 下的永久文件地址 fetch 应带 cookie', () => {
    window['__nocobase_api_base_url__'] = 'https://api.example.com/api/';

    expect(getFileFetchCredentials('https://api.example.com/files/main/main/attachments/1')).toBe('include');
    expect(getFileFetchCredentials('https://cdn.example.com/files/main/main/attachments/1')).toBe('same-origin');
  });

  it('应通过浏览器原生链接下载永久文件 URL', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    triggerFileDownload('/files/main/main/attachments/1', 'report.pdf');

    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.instances[0];
    expect(link.getAttribute('href')).toBe('/files/main/main/attachments/1?download=1');
    expect(link.download).toBe('report.pdf');
    expect(link.rel).toBe('noopener noreferrer');
    expect(document.body.contains(link)).toBe(false);
    click.mockRestore();
  });

  it('下载外部 /files/ 地址时不应追加永久文件参数', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    triggerFileDownload('https://cdn.example.com/files/main/main/attachments/1.png', '1.png');

    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.instances[0];
    expect(link.getAttribute('href')).toBe('https://cdn.example.com/files/main/main/attachments/1.png');
    expect(link.download).toBe('1.png');
    click.mockRestore();
  });

  it('应为 PDF.js 预览资源生成插件静态目录地址', () => {
    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl: '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe('/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs');
  });

  it('应兼容子路径部署下的 PDF.js 预览资源地址', () => {
    window.__nocobase_public_path__ = '/nocobase/v/';
    window.__nocobase_modern_client_prefix__ = 'v';

    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl: '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe(
      '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs',
    );
  });

  it('未注入现代客户端前缀时不应猜测默认前缀', () => {
    window.__nocobase_public_path__ = '/nocobase/v/';

    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: '/nocobase/v/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl: '/nocobase/v/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/nocobase/v/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe(
      '/nocobase/v/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs',
    );
  });

  it('应兼容自定义现代客户端前缀下的 PDF.js 预览资源地址', () => {
    window.__nocobase_public_path__ = '/nocobase/admin/';
    window.__nocobase_modern_client_prefix__ = 'admin';

    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl: '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe(
      '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs',
    );
  });

  it('配置 CDN 地址时应优先使用 CDN 基础路径', () => {
    window.__webpack_public_path__ = 'https://cdn.example.com/assets';
    window.__nocobase_public_path__ = '/nocobase/v/';

    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: 'https://cdn.example.com/assets/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl:
        'https://cdn.example.com/assets/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      'https://cdn.example.com/assets/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe(
      'https://cdn.example.com/assets/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs',
    );
  });
});
