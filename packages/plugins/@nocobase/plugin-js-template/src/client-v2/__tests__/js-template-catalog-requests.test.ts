/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { detachJsTemplateToInline } from '../api/jsTemplatesRequests';
import type { DetachJsTemplateToInlineInput } from '../../shared/types';

const cacheMocks = vi.hoisted(() => ({
  invalidateRuntime: vi.fn(),
  invalidateSettings: vi.fn(),
}));

vi.mock('../resolvers/JsTemplateRuntimeCacheRegistry', () => ({
  getOrLoadJsTemplateSelectableCatalog: vi.fn(),
  invalidateJsTemplateRuntimeCache: cacheMocks.invalidateRuntime,
}));

vi.mock('../resolvers/JsTemplateSettingsDescriptorCache', () => ({
  invalidateJsTemplateSettingsDescriptorCache: cacheMocks.invalidateSettings,
}));

describe('JS Template requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends only the five-field detach contract even when a caller object contains forged source fields', async () => {
    const request = vi.fn(async () => ({ data: { data: { runtimeVersion: 'v2' } } }));
    const input = {
      idempotencyKey: 'detach-sales-v1',
      locator: {
        kind: 'flowModel.step',
        modelUid: 'fm_sales',
        flowKey: 'runJs',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      projectId: 'jtp_source',
      templateId: 'jtt_entry',
      expectedProjectHeadCommitId: 'commit_1',
      files: [{ path: 'forged.ts', content: 'throw new Error();' }],
      entryPath: 'forged.ts',
      kind: 'js-action',
      version: 'forged',
    } satisfies DetachJsTemplateToInlineInput & Record<string, unknown>;

    await detachJsTemplateToInline({ request }, input);

    expect(request).toHaveBeenCalledWith({
      url: 'jsTemplates:detachToInline',
      method: 'post',
      data: {
        idempotencyKey: 'detach-sales-v1',
        locator: input.locator,
        projectId: 'jtp_source',
        templateId: 'jtt_entry',
        expectedProjectHeadCommitId: 'commit_1',
      },
    });
  });
});
