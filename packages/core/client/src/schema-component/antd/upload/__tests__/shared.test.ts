/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getFileDownloadName, toFileList } from '../shared';

describe('upload shared helpers', () => {
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
});
