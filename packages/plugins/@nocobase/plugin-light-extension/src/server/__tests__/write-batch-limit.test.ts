/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension write batch validator', () => {
  it('rejects write batches above the advertised file count limit', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxSyncBatchFiles: 1,
      },
    });
    const diagnostics = validator.validateSyncBatch({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/meta.json',
          content: '{}',
        },
      ],
    });

    expect(validator.getCapabilities().limits.maxSyncBatchFiles).toBe(1);
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'sync_batch_too_large' }));
  });

  it('uses content byte length for source file limits', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxFileBytes: 4,
      },
    });
    const diagnostics = validator.validateSyncBatch({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '12345',
          size: 1,
        },
      ],
    });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'file_size_limit_exceeded' }));
  });

  it('counts UTF-8 bytes for source file limits instead of JavaScript string length', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxFileBytes: 2,
      },
    });
    const diagnostics = validator.validateSyncBatch({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '你',
          size: 1,
        },
      ],
    });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'file_size_limit_exceeded' }));
  });

  it('rejects upserts that only provide a blob hash because content size cannot be verified', () => {
    const diagnostics = new LightExtensionValidator().validateSyncBatch({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          blobHash: 'caller-supplied-blob',
          size: 1,
        },
        {
          path: 'src/client/js-blocks/sales-kpi/old.tsx',
          operation: 'delete',
        },
      ],
    });

    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'source_content_required',
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
      }),
    );
    expect(diagnostics.filter((item) => item.code === 'source_content_required')).toHaveLength(1);
  });
});
