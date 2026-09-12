/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getDocumentCacheKey } from '../document-loader/cached';

describe('document loader cache', () => {
  it('keeps the legacy cache key for main data source files', () => {
    expect(
      getDocumentCacheKey({
        id: 1,
        filename: 'local.docx',
        storageId: 2,
      }),
    ).toBe('1@2');
  });

  it('keeps the legacy cache key for external files by default', () => {
    expect(
      getDocumentCacheKey({
        id: 1,
        filename: 'remote.docx',
        storageId: 2,
        source: {
          dataSourceKey: 'external',
          collectionName: 'attachments',
        },
      }),
    ).toBe('1@2');
  });

  it('does not cache parsed documents when the attachment source disables it', () => {
    expect(
      getDocumentCacheKey({
        id: 1,
        filename: 'remote.docx',
        storageId: 2,
        source: {
          dataSourceKey: 'external',
          collectionName: 'attachments',
          documentCache: false,
        },
      }),
    ).toBeNull();
  });
});
