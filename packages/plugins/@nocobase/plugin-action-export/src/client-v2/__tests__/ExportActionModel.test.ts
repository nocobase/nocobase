/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { ExportActionModel } from '../ExportActionModel';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('ExportActionModel', () => {
  it('serializes a nested resource filter before exporting', async () => {
    const filter = {
      $and: [
        {
          $or: [{ 'org_oho.uuid': { $eq: '1' } }, { 'org_o2m.company': { $eq: 'NocoBase' } }],
        },
      ],
    };
    const runAction = vi.fn(async () => new Uint8Array());
    const resource = {
      getSelectedRows: vi.fn(() => []),
      getFilter: vi.fn(() => filter),
      getAppends: vi.fn(() => ['org_oho', 'org_o2m']),
      getSort: vi.fn(() => ['-createdAt']),
      runAction,
    };
    const blockModel = {
      resource,
      collection: {
        title: 'Users',
        fields: new Map(),
        filterTargetKey: 'id',
        getFilterByTK: vi.fn(),
      },
    };
    const model = new ExportActionModel({
      uid: 'export-action',
      flowEngine: new FlowEngine(),
      props: { exportSettings: [] },
    });
    const handler = model.getFlow('exportSettings')?.getStep('export')?.serialize().handler;
    const ctx = {
      model: {
        getProps: () => ({ exportSettings: [] }),
        context: { blockModel },
      },
      blockModel,
      t: (value: string) => value,
    };

    expect(handler).toBeTypeOf('function');
    if (!handler) {
      throw new Error('Export handler is not registered');
    }

    await handler(ctx as unknown as Parameters<typeof handler>[0], {});

    expect(runAction).toHaveBeenCalledWith(
      'export',
      expect.objectContaining({
        params: expect.objectContaining({
          filter: JSON.stringify(filter),
        }),
      }),
    );
  });
});
