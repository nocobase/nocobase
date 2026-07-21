/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTypeScriptProjectSession } from '../../../../components/code-editor/typescriptProject';
import { RunJSSourceResolverRegistry } from '../../../../components/runjs-source';
import { RunJSEditorRegistry } from '../../../../components/runjs-studio';
import { DEFAULT_JS_PAGE_CODE, JSPageModel } from '../JSPageModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry' as const,
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-page',
};

describe('JSPageModel source authoring', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSourceResolverRegistry.clear();
  });

  it('typechecks the default template with the JS Page authoring context', async () => {
    const session = createTypeScriptProjectSession();
    const diagnostics = await session.getDiagnostics(
      {
        currentFilePath: 'src/main.tsx',
        files: [{ path: 'src/main.tsx', content: DEFAULT_JS_PAGE_CODE }],
        runJSContext: { modelUse: 'JSPageModel' },
      },
      DEFAULT_JS_PAGE_CODE,
    );
    session.dispose();

    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([]);
  });

  it('keeps settings isolated between pages bound to the same entry', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({ code: '' }),
      getSettingsDescriptor: async () => ({
        entryId: SOURCE_BINDING.entryId,
        settingsSchemaHash: 'schema-v1',
        defaults: { label: 'Default' },
        schema: { type: 'object', properties: { label: { type: 'string', title: 'Label' } } },
      }),
    });
    const engine = new FlowEngine();
    engine.registerModels({ JSPageModel });
    const createPage = (uid: string, label: string) =>
      engine.createModel<JSPageModel>({
        uid,
        use: 'JSPageModel',
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'light-extension',
              sourceBinding: SOURCE_BINDING,
              settings: { label },
            },
          },
        },
      });
    const first = createPage('js-page-first', 'First');
    const second = createPage('js-page-second', 'Second');
    const steps = await first.getRuntimeFlowSettingSteps('jsSettings');
    const labelStep = Object.values(steps || {}).find((step) => step.title === 'Label');

    labelStep?.beforeParamsSave?.(first.context, { value: 'Updated first' });

    expect(first.getStepParams('jsSettings', 'runJs')?.settings).toEqual({ label: 'Updated first' });
    expect(second.getStepParams('jsSettings', 'runJs')?.settings).toEqual({ label: 'Second' });
  });

  it('reruns the page once after Studio saves', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSPageModel });
    const model = engine.createModel<JSPageModel>({ uid: 'js-page-save', use: 'JSPageModel' });
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);
    const afterParamsSave = model.getFlow('jsSettings')?.steps?.runJs?.afterParamsSave;

    expect(afterParamsSave).toBeTypeOf('function');
    await afterParamsSave?.({ model } as Parameters<NonNullable<typeof afterParamsSave>>[0]);

    expect(rerender).toHaveBeenCalledOnce();
  });
});
