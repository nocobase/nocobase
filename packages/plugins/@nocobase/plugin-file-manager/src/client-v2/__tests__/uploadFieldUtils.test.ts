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
  getUploadFieldPreviewIndex,
  normalizeUploadFieldFileList,
  shouldShowUploadActionSlot,
} from '../models/uploadFieldUtils';

describe('uploadFieldUtils', () => {
  it('hides the append slot for a single file field that already has a file', () => {
    expect(shouldShowUploadActionSlot(false, 1)).toBe(false);
    expect(shouldShowUploadActionSlot(false, 0)).toBe(true);
    expect(shouldShowUploadActionSlot(true, 1)).toBe(true);
  });

  it('reuses previous uid when external values are written back after upload', () => {
    const previousFileList = [
      {
        uid: 'rc-upload-1',
        filename: 'cover.png',
        response: {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      },
    ];

    const nextFileList = normalizeUploadFieldFileList(
      [
        {
          id: 1,
          url: '/files/cover.png',
          filename: 'cover.png',
        },
      ],
      previousFileList,
    );

    expect(nextFileList[0].uid).toBe('rc-upload-1');
  });

  it('generates stable fallback identities from record data', () => {
    expect(normalizeUploadFieldFileList([{ id: 0, filename: 'zero.png' }])[0].uid).toBe('id:0');
    expect(normalizeUploadFieldFileList([{ url: '/files/avatar.png' }])[0].uid).toBe('url:/files/avatar.png');
    expect(normalizeUploadFieldFileList([{ filename: 'avatar.png' }])[0].uid).toBe('filename:avatar.png:0');
    expect(normalizeUploadFieldFileList([{ name: 'avatar.png' }])[0].uid).toBe('name:avatar.png:0');
    expect(normalizeUploadFieldFileList([{ uid: 'uploading' }])[0].uid).toBe('uploading');
    expect(normalizeUploadFieldFileList([{}])[0].uid).toBe('index:0');
  });

  it('preserves existing thumbnails and derives preview indexes by uid', () => {
    const fileList = normalizeUploadFieldFileList([
      {
        id: 3,
        url: '/files/thumb.png',
        filename: 'thumb.png',
        thumbUrl: 'data:image/png;base64,thumb',
      },
      {
        id: 4,
        url: '/files/report.pdf',
      },
    ]);

    expect(fileList[0].thumbUrl).toBe('data:image/png;base64,thumb');
    expect(fileList[1].thumbUrl).toContain('/file-placeholder/pdf-200-200.png');
    expect(getUploadFieldPreviewIndex(fileList, { uid: 'id:4' })).toBe(1);
    expect(getUploadFieldPreviewIndex(fileList, { uid: 'missing' })).toBe(0);
  });
});
