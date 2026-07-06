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
