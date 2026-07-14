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
  getPermanentFilePreviewUrl,
  isAttachmentURLImage,
  normalizeAttachmentURLFile,
  normalizeAttachmentURLFileList,
} from '../AttachmentURLFieldModel';

describe('AttachmentURLFieldModel', () => {
  it('adds preview thumbnail for permanent file URL values', () => {
    const file = normalizeAttachmentURLFile('/files/main/main/t_n6fvrknhqjr/24.jpg');

    expect(file).toMatchObject({
      url: '/files/main/main/t_n6fvrknhqjr/24.jpg',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/24.jpg?preview=1',
    });
    expect(isAttachmentURLImage(file)).toBe(true);
  });

  it('uses the file type placeholder for permanent non-image URLs', () => {
    const file = normalizeAttachmentURLFile('/files/file/main/t_n6fvrknhqjr/55.xlsx');

    expect(file).toMatchObject({
      url: '/files/file/main/t_n6fvrknhqjr/55.xlsx',
      preview: '/files/file/main/t_n6fvrknhqjr/55.xlsx?preview=1',
    });
    expect(file.thumbUrl).toContain('/file-placeholder/xlsx-200-200.png');
    expect(isAttachmentURLImage(file)).toBe(false);
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

  it('does not treat external /files/ URLs as permanent file URLs', () => {
    const url = 'https://cdn.example.com/files/main/main/t_n6fvrknhqjr/24.jpg';

    expect(getPermanentFilePreviewUrl(url)).toBe('');
    expect(normalizeAttachmentURLFile(url)).toMatchObject({
      uid: url,
      url,
    });
    expect(normalizeAttachmentURLFile(url).preview).toBeUndefined();
  });

  it('merges uploaded response metadata into the Upload file item', () => {
    const file = normalizeAttachmentURLFile({
      status: 'done',
      response: {
        createdAt: '2026-07-09T16:38:01.851Z',
        title: 'icon-alexa-108',
        filename: 'icon-alexa-108-le2a0x.jpg',
        extname: '.jpg',
        size: 8089,
        mimetype: 'image/jpeg',
        path: 'a/b b/c',
        url: '/files/main/main/t_n6fvrknhqjr/24',
        preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
        meta: {},
        id: 24,
        storageId: 1,
        local: true,
      },
    });

    expect(file).toMatchObject({
      status: 'done',
      filename: 'icon-alexa-108-le2a0x.jpg',
      mimetype: 'image/jpeg',
      type: 'image/jpeg',
      url: '/files/main/main/t_n6fvrknhqjr/24',
      preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
    });
    expect(isAttachmentURLImage(file)).toBe(true);
  });

  it('uses the file type placeholder immediately after uploading a non-image file', () => {
    const file = normalizeAttachmentURLFile({
      status: 'done',
      response: {
        filename: 'report.xlsx',
        extname: '.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: '/files/file/main/t_n6fvrknhqjr/55.xlsx',
        preview: '/files/file/main/t_n6fvrknhqjr/55.xlsx?preview=1',
        id: 55,
      },
    });

    expect(file.thumbUrl).toContain('/file-placeholder/xlsx-200-200.png');
    expect(file.thumbUrl).not.toContain('/55.xlsx?preview=1');
    expect(isAttachmentURLImage(file)).toBe(false);
  });

  it('keeps uploaded metadata when the field value is written back as a URL string', () => {
    const previousFileList = normalizeAttachmentURLFileList([
      {
        status: 'done',
        response: {
          createdAt: '2026-07-09T16:38:01.851Z',
          title: 'icon-alexa-108',
          filename: 'icon-alexa-108-le2a0x.jpg',
          extname: '.jpg',
          size: 8089,
          mimetype: 'image/jpeg',
          path: 'a/b b/c',
          url: '/files/main/main/t_n6fvrknhqjr/24',
          preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
          meta: {},
          id: 24,
          storageId: 1,
          local: true,
        },
      },
    ]);

    const [file] = normalizeAttachmentURLFileList(['/files/main/main/t_n6fvrknhqjr/24'], previousFileList);

    expect(file).toMatchObject({
      status: 'done',
      filename: 'icon-alexa-108-le2a0x.jpg',
      mimetype: 'image/jpeg',
      type: 'image/jpeg',
      url: '/files/main/main/t_n6fvrknhqjr/24',
      preview: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/24?preview=1',
    });
    expect(isAttachmentURLImage(file)).toBe(true);
  });

  it('supports response.data wrapped upload responses', () => {
    expect(
      normalizeAttachmentURLFileList([
        {
          status: 'done',
          response: {
            data: {
              id: 25,
              filename: 'avatar.jpg',
              mimetype: 'image/jpeg',
              url: '/files/main/main/t_n6fvrknhqjr/25',
              preview: '/files/main/main/t_n6fvrknhqjr/25?preview=1',
            },
          },
        },
      ])[0],
    ).toMatchObject({
      id: 25,
      url: '/files/main/main/t_n6fvrknhqjr/25',
      thumbUrl: '/files/main/main/t_n6fvrknhqjr/25?preview=1',
    });
  });
});
