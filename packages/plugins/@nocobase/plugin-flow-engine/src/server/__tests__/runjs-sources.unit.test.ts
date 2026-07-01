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
  it('skips Flow Surface authoring validation for FlowModel step RunJS sources', () => {
    const registrar = createRegistrar();
    registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    expect(registrar.inspectors).toHaveLength(1);

    const diagnostics = registrar.inspectors[0]({
      code: "ctx.request({ url: 'users:list' });\nctx.render('Done');",
      path: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      locator: {
        kind: 'flowModel.step',
        modelUid: 'js-step-user-runjs-model',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      legacy: {
        version: 'v2',
        surfaceStyle: 'render',
        language: 'typescript',
        metadata: {
          modelUse: 'JSBlockModel',
        },
      },
    });

    expect(diagnostics).toEqual([]);
  });

  it('keeps Flow Engine authoring validation for chart RunJS sources', () => {
    const registrar = createRegistrar();
    registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const diagnostics = registrar.inspectors[0]({
      code: 'ctx.render(null);',
      path: 'src/main.ts',
      runtimeVersion: 'v2',
      surfaceStyle: 'value',
      locator: {
        kind: 'chart.option',
        modelUid: 'chart-model',
      },
      legacy: {
        version: 'v2',
        surfaceStyle: 'value',
        language: 'typescript',
      },
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'runjs-value-render-forbidden',
        }),
      ]),
    );
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
