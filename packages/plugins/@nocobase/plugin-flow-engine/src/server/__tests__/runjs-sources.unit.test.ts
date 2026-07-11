/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter, RunJSSourceAuthoringInspector } from '@nocobase/plugin-vsc-file';

import { registerFlowModelRunJSSourceAdapters } from '../runjs-sources';

type Registrar = {
  adapters: RunJSSourceAdapter[];
  inspectors: RunJSSourceAuthoringInspector[];
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
  registerRunJSSourceAuthoringInspector: (inspector: RunJSSourceAuthoringInspector) => () => void;
};

describe('flow-engine RunJS source registration', () => {
  it('registers adapters without attaching Flow Surface validation to source saves', () => {
    const registrar = createRegistrar();
    registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    expect(registrar.adapters.length).toBeGreaterThan(0);
    expect(registrar.inspectors).toEqual([]);
  });

  it('rejects a FlowModel step locator when the persisted step is missing', async () => {
    const registrar = createRegistrar();
    const db = {
      getCollection: () => ({
        repository: {
          findModelById: async () => ({
            uid: 'js-step-model',
            use: 'JSBlockModel',
            stepParams: {
              jsSettings: {},
            },
          }),
        },
      }),
    } as unknown as Database;
    registerFlowModelRunJSSourceAdapters({
      db,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const stepAdapter = registrar.adapters.find((adapter) => adapter.kind === 'flowModel.step');
    expect(stepAdapter).toBeDefined();

    await expect(
      stepAdapter?.readLegacy({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'js-step-model',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ctx: {},
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      status: 404,
      details: {
        path: 'stepParams.jsSettings.runJs',
      },
    });
  });
});

function createRegistrar(): Registrar {
  const registrar: Registrar = {
    adapters: [],
    inspectors: [],
    registerRunJSSourceAdapter(adapter) {
      registrar.adapters.push(adapter);
      return () => {
        registrar.adapters = registrar.adapters.filter((item) => item !== adapter);
      };
    },
    registerRunJSSourceAuthoringInspector(inspector) {
      registrar.inspectors.push(inspector);
      return () => {
        registrar.inspectors = registrar.inspectors.filter((item) => item !== inspector);
      };
    },
  };

  return registrar;
}
