/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension repository budget validator', () => {
  it('rejects repositories whose source byte budget exceeds the capabilities limit', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxRepoBytes: 8,
      },
    });
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '12345',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/meta.json',
          content: '{}',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/settings.json',
          content: '{}',
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.capabilities.limits.maxRepoBytes).toBe(8);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'repo_budget_limit_exceeded' }));
  });

  it('uses content byte length for repository budget checks', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxRepoBytes: 4,
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
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'repo_budget_limit_exceeded' }));
  });

  it('counts UTF-8 bytes for repository budget checks', () => {
    const validator = new LightExtensionValidator({
      limits: {
        maxRepoBytes: 2,
      },
    });
    const result = validator.validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '你',
          size: 1,
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'repo_budget_limit_exceeded',
        details: expect.objectContaining({
          totalBytes: 3,
          maxRepoBytes: 2,
        }),
      }),
    );
  });
});
