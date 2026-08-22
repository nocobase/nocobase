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
  getFileDownloadName,
  getLocalPreviewUrl,
  matchMimetype,
  rememberLocalPreviewUrl,
  revokeLocalPreviewUrl,
  toFileList,
} from '../shared';

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe('upload shared helpers', () => {
  afterEach(() => {
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

  it('应为仅包含 URL 的值补齐 title、filename 和 extname', () => {
    const [file] = toFileList('https://example.com/folder/report%20final.jpg?token=1');

    expect(file.title).toBe('report final');
    expect(file.filename).toBe('report final.jpg');
    expect(file.extname).toBe('.jpg');
  });

  it('应为仅包含 URL 的文件生成可下载文件名', () => {
    expect(getFileDownloadName({ url: 'https://example.com/folder/report%20final.jpg?token=1' })).toBe(
      'report final.jpg',
    );
  });

  it('应优先保留已有 filename', () => {
    expect(
      getFileDownloadName({
        url: 'https://example.com/folder/other.jpg?token=1',
        filename: 'custom-name.png',
      }),
    ).toBe('custom-name.png');
  });

  it('应根据 type、preview 或 thumbUrl 判断文件类型', () => {
    expect(matchMimetype({ url: '/files/main/main/files/1', type: 'image/jpeg' } as any, 'image/*')).toBe(true);
    expect(
      matchMimetype(
        {
          url: '/files/main/main/files/1',
          preview: '/storage/uploads/avatar.jpg',
        } as any,
        'image/*',
      ),
    ).toBe(true);
    expect(
      matchMimetype(
        {
          url: '/files/main/main/files/1',
          thumbUrl: '/storage/uploads/avatar.jpg',
        } as any,
        'image/*',
      ),
    ).toBe(true);
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
      preview: '/files/main/main/attachments/1/preview',
    };

    expect(getLocalPreviewUrl(file)).toBe('blob:nocobase-local-preview');

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
      preview: '/files/main/main/attachments/2/preview',
    };
    const [absoluteRecord] = toFileList(record);

    rememberLocalPreviewUrl(record, {
      originFileObj,
      type: 'image/png',
    });

    expect(getLocalPreviewUrl(absoluteRecord)).toBe('blob:nocobase-uploaded-preview');

    revokeLocalPreviewUrl(absoluteRecord);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:nocobase-uploaded-preview');
  });
});
