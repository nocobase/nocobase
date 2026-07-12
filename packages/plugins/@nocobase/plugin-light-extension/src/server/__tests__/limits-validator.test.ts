/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension limits validator', () => {
  it.each([
    {
      name: 'single file size',
      limits: { maxFileBytes: 4 },
      content: '12345',
      code: 'file_size_limit_exceeded',
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      details: { size: 5, maxFileBytes: 4 },
    },
    {
      name: 'single file UTF-8 byte size',
      limits: { maxFileBytes: 2 },
      content: '你',
      code: 'file_size_limit_exceeded',
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      details: { size: 3, maxFileBytes: 2 },
    },
    {
      name: 'repository byte budget',
      limits: { maxRepoBytes: 4 },
      content: '12345',
      code: 'repo_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 5, maxRepoBytes: 4 },
    },
    {
      name: 'repository UTF-8 byte budget',
      limits: { maxRepoBytes: 2 },
      content: '你',
      code: 'repo_budget_limit_exceeded',
      path: undefined,
      details: { totalBytes: 3, maxRepoBytes: 2 },
    },
  ])('enforces $name from actual content bytes', ({ limits, content, code, path, details }) => {
    const result = new LightExtensionValidator({ limits }).validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content,
          size: 1,
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code,
        ...(path ? { path } : {}),
        details: expect.objectContaining(details),
      }),
    );
  });

  it.each([
    { name: 'batch file count', limits: { maxSyncBatchFiles: 1 }, code: 'sync_batch_too_large' },
    { name: 'file byte size', limits: { maxFileBytes: 1 }, code: 'file_size_limit_exceeded' },
  ])('enforces sync $name limits', ({ limits, code }) => {
    const validator = new LightExtensionValidator({ limits });
    const diagnostics = validator.validateSyncBatch({
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', content: '你', size: 1 },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', content: '{}' },
      ],
    });

    expect(diagnostics).toContainEqual(expect.objectContaining({ code }));
  });

  it('requires content for upserts while allowing delete-only items', () => {
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

    expect(diagnostics.filter((item) => item.code === 'source_content_required')).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/sales-kpi/index.tsx' }),
    ]);
  });

  it('enforces entry count, entry file count, and zip ratio limits from capabilities', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxEntries: 1,
        maxEntryFiles: 1,
        maxZipCompressionRatio: 2,
      },
    });
    const workspace = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/one/index.tsx',
          content: 'export default function One() { return null; }\n',
        },
        {
          path: 'src/client/js-blocks/one/meta.json',
          content: '{}',
        },
        {
          path: 'src/client/js-blocks/two/index.tsx',
          content: 'export default function Two() { return null; }\n',
        },
      ],
    });
    const zip = validator.validateZipBudget({
      compressedBytes: 10,
      uncompressedBytes: 100,
    });

    expect(workspace.accepted).toBe(false);
    expect(workspace.capabilities.limits.maxEntries).toBe(1);
    expect(workspace.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['entry_count_limit_exceeded', 'entry_file_count_exceeded']),
    );
    expect(zip).toContainEqual(expect.objectContaining({ code: 'zip_compression_ratio_too_high' }));
  });
});
