/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  getOfficeFileExt,
  getOfficePreviewUrl,
  isOfficeFile,
  parsePermanentFileUrl,
  resolveFileUrl,
  resolveTemporaryOfficeFileUrl,
} from '../utils';

describe('getOfficeFileExt', () => {
  it('reads the extension from an object, preferring extname', () => {
    expect(getOfficeFileExt({ extname: '.DOCX', url: 'https://x/a.pdf' })).toBe('docx');
    expect(getOfficeFileExt({ name: 'report.XLSX' })).toBe('xlsx');
    expect(getOfficeFileExt({ filename: 'deck.pptx' })).toBe('pptx');
    expect(getOfficeFileExt({ url: 'https://x/notes.odt' })).toBe('odt');
  });

  it('reads the extension from a bare URL string and strips query/hash', () => {
    expect(getOfficeFileExt('report.XLSX?token=1')).toBe('xlsx');
    expect(getOfficeFileExt('slides.pptx#page=2')).toBe('pptx');
    expect(getOfficeFileExt('/files/main/main/attachments/42.docx?preview=1')).toBe('docx');
  });

  it('returns an empty string when there is no extension', () => {
    expect(getOfficeFileExt('https://x/folder/')).toBe('');
    expect(getOfficeFileExt(undefined)).toBe('');
    expect(getOfficeFileExt(null)).toBe('');
    expect(getOfficeFileExt({})).toBe('');
  });
});

describe('isOfficeFile', () => {
  it('matches by office mimetype', () => {
    expect(isOfficeFile({ mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe(
      true,
    );
    expect(isOfficeFile({ mimetype: 'application/msword' })).toBe(true);
  });

  it('matches by office extension when mimetype is absent or unrelated', () => {
    expect(isOfficeFile({ url: 'https://x/a.docx' })).toBe(true);
    expect(isOfficeFile('https://x/sheet.xls')).toBe(true);
    expect(isOfficeFile({ mimetype: 'application/octet-stream', extname: '.pptx' })).toBe(true);
  });

  it('does not match non-office files', () => {
    expect(isOfficeFile({ mimetype: 'application/pdf', url: 'https://x/a.pdf' })).toBe(false);
    expect(isOfficeFile('https://x/photo.png')).toBe(false);
    expect(isOfficeFile(undefined)).toBe(false);
    expect(isOfficeFile(null)).toBe(false);
  });
});

describe('resolveFileUrl', () => {
  it('passes through absolute http(s) URLs unchanged', () => {
    expect(resolveFileUrl({ url: 'https://cdn.example.com/a.docx' })).toBe('https://cdn.example.com/a.docx');
    expect(resolveFileUrl('http://cdn.example.com/a.docx')).toBe('http://cdn.example.com/a.docx');
  });

  it('prefixes relative URLs with the current origin', () => {
    expect(resolveFileUrl({ url: '/nocobase/storage/uploads/a.docx' })).toBe(
      `${window.location.origin}/nocobase/storage/uploads/a.docx`,
    );
    expect(resolveFileUrl('storage/uploads/a.docx')).toBe(`${window.location.origin}/storage/uploads/a.docx`);
  });

  it('returns an empty string when there is no url', () => {
    expect(resolveFileUrl(undefined)).toBe('');
    expect(resolveFileUrl({})).toBe('');
  });
});

describe('getOfficePreviewUrl', () => {
  it('wraps the resolved url in the Microsoft Office online viewer', () => {
    const result = getOfficePreviewUrl({ url: 'https://cdn.example.com/a.docx' });
    const parsed = new URL(result);
    expect(parsed.origin + parsed.pathname).toBe('https://view.officeapps.live.com/op/embed.aspx');
    expect(parsed.searchParams.get('src')).toBe('https://cdn.example.com/a.docx');
  });

  it('returns an empty string when the file has no url', () => {
    expect(getOfficePreviewUrl(undefined)).toBe('');
    expect(getOfficePreviewUrl({})).toBe('');
  });
});

describe('parsePermanentFileUrl', () => {
  it('parses canonical permanent URLs by path segments', () => {
    expect(parsePermanentFileUrl('/nocobase/files/subapp/another/reports/42')).toEqual({
      appName: 'subapp',
      dataSourceKey: 'another',
      collectionName: 'reports',
      id: '42',
    });
    expect(parsePermanentFileUrl('/files/main/main/attachments/1?preview=1')).toEqual({
      appName: 'main',
      dataSourceKey: 'main',
      collectionName: 'attachments',
      id: '1',
    });
    expect(parsePermanentFileUrl('/files/main/another/files/42')).toEqual({
      appName: 'main',
      dataSourceKey: 'another',
      collectionName: 'files',
      id: '42',
    });
    expect(parsePermanentFileUrl('/files/main/main/attachments/42.docx')).toEqual({
      appName: 'main',
      dataSourceKey: 'main',
      collectionName: 'attachments',
      id: '42',
    });
    expect(parsePermanentFileUrl('/files/main/main/attachments/42.docx?preview=1')).toEqual({
      appName: 'main',
      dataSourceKey: 'main',
      collectionName: 'attachments',
      id: '42',
    });
  });

  it('rejects external, temporary, and malformed file URLs', () => {
    expect(parsePermanentFileUrl('https://files.example.com/files/main/main/attachments/1')).toBeNull();
    expect(parsePermanentFileUrl('/files/main/main/attachments/1?temporary-access-token=x')).toBeNull();
    expect(parsePermanentFileUrl('/files/main/main/attachments/1/preview')).toBeNull();
    expect(parsePermanentFileUrl('/files/main/main/attachments')).toBeNull();
  });
});

describe('resolveTemporaryOfficeFileUrl', () => {
  it('requests a temporary URL using the file record and collection context', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          url: '/files/subapp/another/reports/42.xlsx?temporary-access-token=signed',
        },
      },
    });

    await expect(
      resolveTemporaryOfficeFileUrl(
        { request },
        {
          id: 42,
          storageId: 1,
          url: '/files/subapp/another/reports/42',
        },
        { dataSourceKey: 'another', collectionName: 'reports' },
      ),
    ).resolves.toBe(`${window.location.origin}/files/subapp/another/reports/42.xlsx?temporary-access-token=signed`);
    expect(request).toHaveBeenCalledWith({
      url: 'reports:createTemporaryURL/42',
      method: 'post',
      headers: {
        'X-Data-Source': 'another',
      },
    });
  });

  it('passes external URLs through without requesting a token', async () => {
    const request = vi.fn();

    await expect(
      resolveTemporaryOfficeFileUrl(
        { request },
        { id: 42, url: 'https://cdn.example.com/report.xlsx' },
        { dataSourceKey: 'main', collectionName: 'attachments' },
      ),
    ).resolves.toBe('https://cdn.example.com/report.xlsx');
    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to permanent URL metadata when collection context is unavailable', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { url: '/files/main/main/attachments/42.xlsx?temporary-access-token=signed' },
    });

    await expect(
      resolveTemporaryOfficeFileUrl({ request }, { id: 42, storageId: 1, url: '/files/main/main/attachments/42' }),
    ).resolves.toBe(`${window.location.origin}/files/main/main/attachments/42.xlsx?temporary-access-token=signed`);
    expect(request).toHaveBeenCalledWith({
      url: 'attachments:createTemporaryURL/42',
      method: 'post',
      headers: {
        'X-App': 'main',
        'X-Data-Source': 'main',
      },
    });
  });

  it('uses attachment URL metadata only when the configured collection matches the URL', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { url: '/files/main/main/attachments/42.xlsx?temporary-access-token=signed' },
    });
    const file = '/files/main/main/attachments/42';

    await expect(
      resolveTemporaryOfficeFileUrl({ request }, file, { dataSourceKey: 'main', collectionName: 'attachments' }),
    ).resolves.toContain('/42.xlsx?temporary-access-token=signed');
    expect(request).toHaveBeenCalledWith({
      url: 'attachments:createTemporaryURL/42',
      method: 'post',
      headers: {
        'X-App': 'main',
        'X-Data-Source': 'main',
      },
    });

    request.mockClear();
    await expect(
      resolveTemporaryOfficeFileUrl({ request }, file, { dataSourceKey: 'main', collectionName: 'otherFiles' }),
    ).resolves.toBe(`${window.location.origin}${file}`);
    expect(request).not.toHaveBeenCalled();
  });

  it('uses the record id from a permanent URL containing extname', async () => {
    const request = vi.fn().mockResolvedValue({
      data: { url: '/files/main/main/attachments/42.docx?temporary-access-token=signed' },
    });

    await expect(
      resolveTemporaryOfficeFileUrl({ request }, '/files/main/main/attachments/42.docx', {
        dataSourceKey: 'main',
        collectionName: 'attachments',
      }),
    ).resolves.toContain('/42.docx?temporary-access-token=signed');
    expect(request).toHaveBeenCalledWith({
      url: 'attachments:createTemporaryURL/42',
      method: 'post',
      headers: {
        'X-App': 'main',
        'X-Data-Source': 'main',
      },
    });
  });

  it('rejects a signing response without a URL', async () => {
    const request = vi.fn().mockResolvedValue({ data: {} });

    await expect(
      resolveTemporaryOfficeFileUrl(
        { request },
        { id: 1, storageId: 1, url: '/files/main/main/attachments/1' },
        { dataSourceKey: 'main', collectionName: 'attachments' },
      ),
    ).rejects.toThrow('Temporary file URL is missing');
  });
});
