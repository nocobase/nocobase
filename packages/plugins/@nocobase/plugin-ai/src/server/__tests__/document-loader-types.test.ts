/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { SUPPORTED_DOCUMENT_EXTNAMES } from '../document-loader/constants';

describe('supported document types', () => {
  it('supports pptx but not legacy ppt files', () => {
    expect(SUPPORTED_DOCUMENT_EXTNAMES).toContain('.pptx');
    expect(SUPPORTED_DOCUMENT_EXTNAMES).not.toContain('.ppt');
  });
});
