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
  getFileName,
  getPdfPreviewApiSrc,
  getPdfPreviewResourceOptions,
  getPdfPreviewWorkerSrc,
  getPreviewThumbnailUrl,
  isActiveContentFile,
  isSameOriginUrl,
} from '../filePreviewTypes';

describe('getDownloadFileName', () => {
  afterEach(() => {
    delete window.__webpack_public_path__;
    delete window.__nocobase_public_path__;
    delete window.__nocobase_modern_client_prefix__;
    vi.restoreAllMocks();
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

  it('应识别同源和跨源文件地址', () => {
    expect(isSameOriginUrl('/storage/uploads/report.pdf')).toBe(true);
    expect(isSameOriginUrl(`${window.location.origin}/storage/uploads/report.pdf`)).toBe(true);
    expect(isSameOriginUrl('https://files.example.com/storage/uploads/report.pdf')).toBe(false);
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
