import { describe, expect, it } from 'vitest';

import {
  isSafeImagePreview,
  resolveFilePreviewKind,
  resolveOfficeOpenXmlFormat,
  resolveOfficeEmbedUrl,
} from '../../.registry-test-app/client/extensions/nocobase-file-component-ui/lib/file-preview.js';
import type { FileRecord } from '../../client/index.js';

function fileRecord(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: 'file-1',
    filename: 'file.bin',
    mimeType: 'application/octet-stream',
    size: 1,
    disk: 'local',
    key: 'objects/file-1.bin',
    ext: 'bin',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
    contentUrl: '/api/files/file-1/content',
    ...overrides,
  };
}

describe('file preview resolution', () => {
  it.each([
    ['text/markdown', 'notes.txt'],
    ['text/plain', 'notes.md'],
  ])('recognizes Markdown from %s and %s', (mimeType, filename) => {
    expect(resolveFilePreviewKind(fileRecord({ mimeType, filename }))).toBe(
      'markdown',
    );
  });

  it.each([
    ['application/msword', 'report.bin'],
    ['application/octet-stream', 'report.doc'],
    ['application/vnd.oasis.opendocument.text', 'report.bin'],
    ['application/octet-stream', 'report.odt'],
    ['application/octet-stream', 'report.ott'],
    ['application/vnd.oasis.opendocument.text-template', 'report.bin'],
  ])('recognizes Office files from %s and %s', (mimeType, filename) => {
    expect(resolveFilePreviewKind(fileRecord({ mimeType, filename }))).toBe(
      'office',
    );
  });

  it.each([
    ['application/octet-stream', 'REPORT.DOCX', 'docx'],
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=binary',
      'report.bin',
      'xlsx',
    ],
    [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'report.bin',
      'pptx',
    ],
  ] as const)(
    'recognizes browser-rendered OOXML from %s and %s',
    (mimeType, filename, format) => {
      const file = fileRecord({ mimeType, filename });
      expect(resolveOfficeOpenXmlFormat(file)).toBe(format);
      expect(resolveFilePreviewKind(file)).toBe('ooxml');
    },
  );

  it('uses the OOXML filename extension when MIME metadata is generic or stale', () => {
    expect(
      resolveOfficeOpenXmlFormat(
        fileRecord({ filename: 'report.docx', mimeType: 'application/msword' }),
      ),
    ).toBe('docx');
  });

  it('keeps a legacy Office extension on the Office Online path', () => {
    const file = fileRecord({
      filename: 'report.doc',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(resolveOfficeOpenXmlFormat(file)).toBeUndefined();
    expect(resolveFilePreviewKind(file)).toBe('office');
  });

  it('keeps active content unsupported even with a previewable extension', () => {
    expect(
      resolveFilePreviewKind(
        fileRecord({ filename: 'unsafe.md', mimeType: 'text/html' }),
      ),
    ).toBe('unsupported');
  });

  it.each([
    ['image/svg+xml; charset=utf-8', 'unsafe.png'],
    ['image/png', 'unsafe.svg'],
  ])('rejects active image content from %s and %s', (mimeType, filename) => {
    expect(isSafeImagePreview(fileRecord({ mimeType, filename }))).toBe(false);
  });

  it('creates an Office Online URL for an absolute public HTTP(S) URL', () => {
    const embed = resolveOfficeEmbedUrl(
      'https://files.example.com/report.docx?token=one',
    );
    expect(embed).toBeDefined();
    const url = new URL(embed ?? '');
    expect(url.origin).toBe('https://view.officeapps.live.com');
    expect(url.searchParams.get('src')).toBe(
      'https://files.example.com/report.docx?token=one',
    );
  });

  it.each([
    '/api/files/report/content',
    'blob:https://app.example.com/id',
    'http://localhost/report.docx',
    'http://localhost./report.docx',
    'https://printer.local/report.docx',
    'https://intranet/report.docx',
    'https://user:password@files.example.com/report.docx',
    'http://127.0.0.1/report.docx',
    'http://10.0.0.2/report.docx',
    'http://192.168.1.2/report.docx',
  ])('rejects a non-public Office source URL %s', (url) => {
    expect(resolveOfficeEmbedUrl(url)).toBeUndefined();
  });
});
