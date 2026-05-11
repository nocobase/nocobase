/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDownloadFileName } from '../filePreviewTypes';

describe('getDownloadFileName', () => {
  afterEach(() => {
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
});
