/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension file size limit validator', () => {
  it('rejects a single source file above the advertised limit', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxFileBytes: 4,
      },
    });
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '12345',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.capabilities.limits.maxFileBytes).toBe(4);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'file_size_limit_exceeded',
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
      }),
    );
  });

  it('uses content byte length instead of trusting caller supplied size', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxFileBytes: 4,
      },
    });
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '12345',
          size: 1,
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'file_size_limit_exceeded',
      }),
    );
  });

  it('counts UTF-8 bytes instead of JavaScript string length', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxFileBytes: 2,
      },
    });
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '你',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'file_size_limit_exceeded',
        details: expect.objectContaining({
          size: 3,
          maxFileBytes: 2,
        }),
      }),
    );
  });
});
