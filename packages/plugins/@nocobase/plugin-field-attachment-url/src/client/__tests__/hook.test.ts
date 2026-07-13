/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getPermanentFilePreviewUrl, normalizeAttachmentUrlValue, toAttachmentUrlValueItem } from '../hook';

describe('attachment url hook helpers', () => {
  it('wraps permanent URL strings with preview metadata for v1 Upload display', () => {
    expect(normalizeAttachmentUrlValue('/files/main/main/t_n6fvrknhqjr/24.jpg')).toMatchObject({
      uid: '/files/main/main/t_n6fvrknhqjr/24.jpg',
      id: '/files/main/main/t_n6fvrknhqjr/24.jpg',
      url: '/files/main/main/t_n6fvrknhqjr/24.jpg',
      preview: '/files/main/main/t_n6fvrknhqjr/24.jpg?preview=1',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/24.jpg?preview=1',
    });
  });

  it('does not mark permanent non-image URLs as images', () => {
    expect(normalizeAttachmentUrlValue('/files/file/main/t_n6fvrknhqjr/55.xlsx')).toEqual({
      uid: '/files/file/main/t_n6fvrknhqjr/55.xlsx',
      id: '/files/file/main/t_n6fvrknhqjr/55.xlsx',
      url: '/files/file/main/t_n6fvrknhqjr/55.xlsx',
    });
  });

  it('keeps external URL strings unchanged', () => {
    expect(normalizeAttachmentUrlValue('https://example.com/report.xlsx')).toBe('https://example.com/report.xlsx');
  });

  it('reuses uploaded metadata when the saved field value is written back as a URL string', () => {
    const fileMetaByUrl = new Map<string, Record<string, unknown>>();
    fileMetaByUrl.set('/files/main/main/t_n6fvrknhqjr/24', {
      id: 24,
      filename: 'icon-alexa-108-le2a0x.jpg',
      mimetype: 'image/jpeg',
      url: '/files/main/main/t_n6fvrknhqjr/24',
      preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
    });

    expect(normalizeAttachmentUrlValue('/files/main/main/t_n6fvrknhqjr/24', fileMetaByUrl)).toMatchObject({
      id: 24,
      filename: 'icon-alexa-108-le2a0x.jpg',
      mimetype: 'image/jpeg',
      type: 'image/jpeg',
      url: '/files/main/main/t_n6fvrknhqjr/24',
      preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
    });
  });

  it('uses the preview query parameter', () => {
    expect(getPermanentFilePreviewUrl('/files/main/main/t_n6fvrknhqjr/24?preview=1')).toBe(
      '/files/main/main/t_n6fvrknhqjr/24?preview=1',
    );
    expect(getPermanentFilePreviewUrl('/files/main/main/t_n6fvrknhqjr/24.docx')).toBe(
      '/files/main/main/t_n6fvrknhqjr/24.docx?preview=1',
    );
    expect(getPermanentFilePreviewUrl('/files/main/main/t_n6fvrknhqjr/24?temporaryAccessToken=signed')).toBe('');
  });

  it('keeps Attachment URL saved value as a string after upload', () => {
    expect(
      toAttachmentUrlValueItem({
        id: 24,
        filename: 'icon-alexa-108-le2a0x.jpg',
        mimetype: 'image/jpeg',
        url: '/files/main/main/t_n6fvrknhqjr/24',
        preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
      }),
    ).toBe('/files/main/main/t_n6fvrknhqjr/24');
  });

  it('supports response.data wrapped upload responses', () => {
    expect(
      toAttachmentUrlValueItem({
        data: {
          id: 25,
          filename: 'avatar.jpg',
          mimetype: 'image/jpeg',
          url: '/files/main/main/t_n6fvrknhqjr/25',
          preview: '/files/main/main/t_n6fvrknhqjr/25?preview=1',
        },
      }),
    ).toBe('/files/main/main/t_n6fvrknhqjr/25');
  });
});
