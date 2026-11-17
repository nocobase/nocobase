/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  getOfficeFileExt,
  getOfficePreviewUrl,
  isOfficeFile,
  resolveFileUrl,
  getAbsoluteFileUrl,
  getFileNameWithExt,
  isImageOrPdf,
  isPrivateNetwork,
  isMixedContent,
  encodeUrlForKKFileView,
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

describe('getAbsoluteFileUrl', () => {
  it('resolves relative URLs', () => {
    expect(getAbsoluteFileUrl({ url: '/uploads/file.docx' })).toBe(`${window.location.origin}/uploads/file.docx`);
  });

  it('passes through absolute URLs', () => {
    expect(getAbsoluteFileUrl({ url: 'https://cdn.com/file.docx' })).toBe('https://cdn.com/file.docx');
  });

  it('returns empty for empty url', () => {
    expect(getAbsoluteFileUrl({})).toBe('');
    expect(getAbsoluteFileUrl({ url: '' })).toBe('');
  });
});

describe('getFileNameWithExt', () => {
  it('prefers title', () => {
    expect(getFileNameWithExt({ title: 'report', extname: '.xlsx' })).toBe('report.xlsx');
  });

  it('falls back to filename', () => {
    expect(getFileNameWithExt({ filename: 'data.csv' })).toBe('data.csv');
  });

  it('does not double-append extension', () => {
    expect(getFileNameWithExt({ title: 'report.xlsx', extname: '.xlsx' })).toBe('report.xlsx');
  });
});

describe('isImageOrPdf', () => {
  it('detects images by mimetype', () => {
    expect(isImageOrPdf({ mimetype: 'image/png' })).toBe(true);
  });

  it('detects pdf by mimetype', () => {
    expect(isImageOrPdf({ mimetype: 'application/pdf' })).toBe(true);
  });

  it('detects images by extension', () => {
    expect(isImageOrPdf({ extname: '.jpg' })).toBe(true);
  });

  it('returns false for office files', () => {
    expect(isImageOrPdf({ extname: '.docx' })).toBe(false);
  });
});

describe('isPrivateNetwork', () => {
  it('detects localhost', () => {
    expect(isPrivateNetwork('localhost')).toBe(true);
  });

  it('detects 192.168.x.x', () => {
    expect(isPrivateNetwork('192.168.1.1')).toBe(true);
  });

  it('detects 10.x.x.x', () => {
    expect(isPrivateNetwork('10.0.0.1')).toBe(true);
  });

  it('detects 172.16-31.x.x', () => {
    expect(isPrivateNetwork('172.16.0.1')).toBe(true);
  });

  it('returns false for public domains', () => {
    expect(isPrivateNetwork('example.com')).toBe(false);
  });

  it('returns false for public IPs', () => {
    expect(isPrivateNetwork('8.8.8.8')).toBe(false);
  });
});

describe('isMixedContent', () => {
  it('detects http URL when page is https', () => {
    expect(isMixedContent('http://localhost:8012')).toBe(true);
  });

  it('returns false for https URLs', () => {
    expect(isMixedContent('https://example.com')).toBe(false);
  });
});

describe('encodeUrlForKKFileView', () => {
  it('encodes a simple URL', () => {
    const result = encodeUrlForKKFileView('http://example.com/file.pdf');
    expect(result).toBeTruthy();
    expect(() => decodeURIComponent(result)).not.toThrow();
  });

  it('returns empty for empty input', () => {
    expect(encodeUrlForKKFileView('')).toBe('');
  });
});
