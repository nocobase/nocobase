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
import { createTypeScriptProjectSession } from '../../../../components/code-editor/typescriptProject';
import { RunJSEditorField } from '../../../../components/runjs-studio';
import { DEFAULT_JS_PAGE_CODE, JSPageModel } from '../JSPageModel';
import { JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD } from '../JSPageSourceModeField';

describe('JSPageModel source authoring', () => {
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

  it('uses the replaceable source field and embedded RunJS Studio', () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSPageModel });
    const model = engine.createModel<JSPageModel>({ uid: 'js-page-source', use: 'JSPageModel' });
    const flow = model.getFlow('jsSettings');
    const sourceMode = flow?.steps?.sourceMode;
    const runJs = flow?.steps?.runJs;
    const code = runJs?.uiSchema?.code as Record<string, unknown>;

    expect(sourceMode?.persistParams).toBe(false);
    expect(sourceMode?.uiSchema?.sourceMode?.['x-component']).toBe(JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD);
    expect(code['x-component']).toBe(RunJSEditorField);
    expect(code['x-component-props']).toMatchObject({
      locatorFactory: 'flowModel.step',
      sourceMetadata: { lightExtensionKind: 'js-page' },
      scene: 'page',
      surfaceStyle: 'render',
    });
    expect(runJs?.uiMode).toMatchObject({ type: 'embed', props: { footer: null } });
  });

  it('reads source-mode defaults from the canonical runJs step', () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSPageModel });
    const model = engine.createModel<JSPageModel>({
      uid: 'js-page-external-source',
      use: 'JSPageModel',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: { entryId: 'entry-1' },
            settings: { color: 'blue' },
          },
        },
      },
    });
    const defaultParams = model.getFlow('jsSettings')?.getStep('sourceMode')?.defaultParams;

    expect(typeof defaultParams).toBe('function');
    expect(
      typeof defaultParams === 'function'
        ? defaultParams({ model } as Parameters<typeof defaultParams>[0])
        : defaultParams,
    ).toEqual({
      sourceMode: 'light-extension',
      sourceBinding: { entryId: 'entry-1' },
      settings: { color: 'blue' },
    });
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
