/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FilePreviewRenderer,
  FilePreviewTypes,
  filePreviewTypes,
  getDownloadFileName,
  getFallbackIcon,
  getFileName,
  getFileUrl,
  getPdfPreviewApiSrc,
  getPdfPreviewErrorCode,
  getPdfPreviewResourceOptions,
  getPdfPreviewWorkerSrc,
  getPreviewFileUrl,
  getPreviewThumbnailUrl,
  isActiveContentFile,
  isPdfFile,
  isSameOriginUrl,
  matchMimetype,
  normalizePreviewFile,
  wrapWithModalPreviewer,
} from '../previewer/filePreviewTypes';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Modal: ({ children, footer, onCancel, open, title }: React.PropsWithChildren<Record<string, unknown>>) =>
      open ? (
        <div role="dialog" aria-label={String(title || 'preview')}>
          <button type="button" onClick={() => onCancel?.()}>
            close
          </button>
          {children}
          <div>{footer as React.ReactNode}</div>
        </div>
      ) : null,
  };
});

vi.mock('react-i18next', () => ({
  Trans: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useTranslation: () => ({
    t: (value: string) => value,
  }),
}));

const browserWindow = window as Window & {
  __webpack_public_path__?: string;
  __nocobase_public_path__?: string;
  __nocobase_modern_client_prefix__?: string;
};

describe('file preview helpers', () => {
  afterEach(() => {
    delete browserWindow.__webpack_public_path__;
    delete browserWindow.__nocobase_public_path__;
    delete browserWindow.__nocobase_modern_client_prefix__;
    cleanup();
    vi.restoreAllMocks();
  });

  it('normalizes preview file inputs and resolves URLs', () => {
    expect(normalizePreviewFile('/storage/a.png')).toEqual({ url: '/storage/a.png' });
    expect(getPreviewFileUrl({ preview: '/preview/a.png', url: '/storage/a.png' })).toBe('/preview/a.png');
    expect(getPreviewFileUrl('/storage/a.png')).toBe('/storage/a.png');
    expect(getPreviewFileUrl(null)).toBe('');
    expect(getFileUrl({ preview: '/preview/a.png', url: '/storage/a.png' })).toBe('/storage/a.png');
    expect(getFileUrl('/storage/a.png')).toBe('/storage/a.png');
    expect(getFileUrl(null)).toBe('');
  });

  it('derives safe filenames and active content classifications', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    expect(getFileName({ url: 'https://example.com/files/%E6%B5%8B%E8%AF%95.pdf?token=1' })).toBe('测试.pdf');
    expect(getDownloadFileName({ filename: 'avatar', extname: '.png', url: '/files/avatar.png' })).toBe(
      '1700000000000_avatar.png',
    );
    expect(getDownloadFileName({ filename: 'contract.pdf', url: '/files/contract.pdf?download=1' })).toBe(
      '1700000000000_contract.pdf',
    );
    expect(getDownloadFileName({ url: '/files/report.xlsx?token=1' })).toBe('1700000000000_report.xlsx');
    expect(isActiveContentFile({ mimetype: 'image/svg+xml', url: '/files/logo.svg' })).toBe(true);
    expect(isActiveContentFile({ filename: 'index.html', url: '/files/index.html' })).toBe(true);
    expect(isActiveContentFile({ mimetype: 'image/png', url: '/files/avatar.png' })).toBe(false);
    expect(isPdfFile({ mimetype: 'application/pdf' })).toBe(true);
    expect(isPdfFile({ filename: 'report.pdf', url: '/files/report.pdf' })).toBe(true);
  });

  it('matches mimetypes from uploaded files, persisted mimetypes and URL extensions', () => {
    expect(matchMimetype({ originFileObj: {}, type: 'image/png' }, 'image/*')).toBe(true);
    expect(matchMimetype({ mimetype: 'video/mp4' }, 'video/*')).toBe(true);
    expect(matchMimetype({ url: '/files/report.pdf?token=1' }, 'application/pdf')).toBe(true);
    expect(matchMimetype({ url: '/files/report.unknown' }, 'application/pdf')).toBe(false);
    expect(matchMimetype(null, 'image/*')).toBe(false);
  });

  it('uses placeholders for active or unsupported preview thumbnails', () => {
    expect(getFallbackIcon({ filename: 'report.pdf' })).toContain('/file-placeholder/pdf-200-200.png');
    expect(getPreviewThumbnailUrl({ mimetype: 'image/svg+xml', url: '/files/logo.svg' })).toContain(
      '/file-placeholder/svg-200-200.png',
    );
    expect(getPreviewThumbnailUrl({ mimetype: 'image/png', url: '/files/avatar.png' })).toBe('/files/avatar.png');
    expect(getPreviewThumbnailUrl({ url: '/files/archive.bin' })).toContain('/file-placeholder/unknown-200-200.png');
  });

  it('supports custom preview types with priority over defaults', () => {
    const types = new FilePreviewTypes();
    types.add({ match: () => true, getThumbnailURL: () => 'fallback' });
    types.add({ match: (file) => file?.kind === 'custom', getThumbnailURL: () => 'custom' });

    expect(types.getTypeByFile({ kind: 'custom' })?.getThumbnailURL?.({})).toBe('custom');
    expect(types.getTypeByFile({ kind: 'other' })?.getThumbnailURL?.({})).toBe('fallback');
  });

  it('detects same-origin URLs and builds PDF.js static resource URLs', () => {
    expect(isSameOriginUrl('/storage/uploads/report.pdf')).toBe(true);
    expect(isSameOriginUrl(`${window.location.origin}/storage/uploads/report.pdf`)).toBe(true);
    expect(isSameOriginUrl('https://files.example.com/storage/uploads/report.pdf')).toBe(false);
    expect(isSameOriginUrl('::::')).toBe(true);

    expect(getPdfPreviewResourceOptions()).toEqual({
      cMapPacked: true,
      cMapUrl: '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/cmaps/',
      standardFontDataUrl: '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/standard_fonts/',
    });
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );
    expect(getPdfPreviewApiSrc()).toBe('/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs');

    browserWindow.__nocobase_public_path__ = '/nocobase/v/';
    browserWindow.__nocobase_modern_client_prefix__ = 'v';
    expect(getPdfPreviewWorkerSrc()).toBe(
      '/nocobase/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.worker.min.mjs',
    );

    browserWindow.__webpack_public_path__ = 'https://cdn.example.com/assets';
    expect(getPdfPreviewApiSrc()).toBe(
      'https://cdn.example.com/assets/static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/pdf.min.mjs',
    );
  });

  it('renders modal previewers and wires navigation, close and download actions', () => {
    const Previewer = wrapWithModalPreviewer(({ file }) => <div>{getFileName(file)}</div>);
    const onOpenChange = vi.fn();
    const onClose = vi.fn();
    const onSwitchIndex = vi.fn();
    const onDownload = vi.fn();

    render(
      <Previewer
        open={true}
        file={{ filename: 'b.txt', url: '/b.txt' }}
        index={1}
        list={[{ url: '/a.txt' }, { url: '/b.txt' }, { url: '/c.txt' }]}
        onOpenChange={onOpenChange}
        onClose={onClose}
        onSwitchIndex={onSwitchIndex}
        onDownload={onDownload}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'b.txt' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('left'));
    fireEvent.click(screen.getByLabelText('right'));
    fireEvent.click(screen.getByLabelText('download'));
    fireEvent.click(screen.getByText('close'));

    expect(onSwitchIndex).toHaveBeenCalledWith(0);
    expect(onSwitchIndex).toHaveBeenCalledWith(2);
    expect(onDownload).toHaveBeenCalledWith({ filename: 'b.txt', url: '/b.txt' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders built-in previewers for supported and unsupported files', () => {
    const onDownload = vi.fn();

    const { rerender } = render(
      <FilePreviewRenderer
        open={true}
        file={{ mimetype: 'audio/mpeg', url: '/song.mp3' }}
        index={0}
        list={[{ mimetype: 'audio/mpeg', url: '/song.mp3' }]}
        onDownload={onDownload}
      />,
    );
    expect(document.querySelector('audio source')?.getAttribute('src')).toBe('/song.mp3');

    rerender(
      <FilePreviewRenderer
        open={true}
        file={{ mimetype: 'video/mp4', url: '/clip.mp4' }}
        index={0}
        list={[{ mimetype: 'video/mp4', url: '/clip.mp4' }]}
        onDownload={onDownload}
      />,
    );
    expect(document.querySelector('video source')?.getAttribute('src')).toBe('/clip.mp4');

    rerender(
      <FilePreviewRenderer
        open={true}
        file={{ mimetype: 'text/plain', url: '/note.txt' }}
        index={0}
        list={[{ mimetype: 'text/plain', url: '/note.txt' }]}
        onDownload={onDownload}
      />,
    );
    expect(document.querySelector('iframe')?.getAttribute('src')).toBe('/note.txt');

    rerender(
      <FilePreviewRenderer
        open={true}
        file={{ mimetype: 'application/octet-stream', url: '/archive.bin' }}
        index={0}
        list={[{ mimetype: 'application/octet-stream', url: '/archive.bin' }]}
        onDownload={onDownload}
      />,
    );
    fireEvent.click(screen.getByText('download it to preview'));
    expect(onDownload).toHaveBeenCalledWith({ mimetype: 'application/octet-stream', url: '/archive.bin' });

    expect(FilePreviewRenderer({ file: null, index: 0, list: [], onDownload })).toBeNull();
    expect(getPdfPreviewErrorCode(new Error('boom'))).toBe('document');
  });

  it('returns nothing for previewer branches without a renderable source or component', () => {
    const originalTypes = filePreviewTypes.types;

    const { container, rerender } = render(
      <FilePreviewRenderer
        file={{ mimetype: 'audio/mpeg' }}
        index={0}
        list={[{ mimetype: 'audio/mpeg' }]}
        onDownload={vi.fn()}
      />,
    );
    expect(container.querySelector('audio')).not.toBeInTheDocument();

    rerender(
      <FilePreviewRenderer
        file={{ mimetype: 'video/mp4' }}
        index={0}
        list={[{ mimetype: 'video/mp4' }]}
        onDownload={vi.fn()}
      />,
    );
    expect(container.querySelector('video')).not.toBeInTheDocument();

    filePreviewTypes.types = [
      {
        match: () => true,
      },
    ];
    expect(FilePreviewRenderer({ file: { url: '/file.bin' }, index: 0, list: [], onDownload: vi.fn() })).toBeNull();
    filePreviewTypes.types = originalTypes;
  });

  it('falls back to a user-facing warning when same-origin PDF resources cannot be loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <FilePreviewRenderer
        open={true}
        file={{ mimetype: 'application/pdf', url: '/report.pdf' }}
        index={0}
        list={[{ mimetype: 'application/pdf', url: '/report.pdf' }]}
        onDownload={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'PDF preview resources failed to load. Please refresh the page and check whether plugin static files are deployed correctly.',
        ),
      ).toBeInTheDocument();
    });
    expect(warn).toHaveBeenCalledWith(
      '[file-manager] PDF preview failed',
      expect.objectContaining({
        code: 'resources',
        src: '/report.pdf',
      }),
    );
  });
});
