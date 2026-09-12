/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import '../globalStyles';

describe('client-v2 global styles', () => {
  it('includes flow view visibility classes used by drawer and dialog views', () => {
    const styleText = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent || '')
      .join('\n');

    expect(styleText).toContain('.nb-hidden');
    expect(styleText).toContain('display:none');
    expect(styleText).toContain('.nb-dialog-overflow-hidden .ant-modal-content');
    expect(styleText).toContain('overflow:hidden');
  });
});
