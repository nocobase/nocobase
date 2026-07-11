/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  FlowContext,
  FlowEngine,
  FlowModel,
  FlowSettingsContextProvider,
  type RunJSValue,
} from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runJSValueEditor: vi.fn((_props: Record<string, unknown>) => null),
}));

vi.mock('../../components/RunJSValueEditor', () => ({
  RunJSValueEditor: (props: Record<string, unknown>) => {
    mocks.runJSValueEditor(props);
    return null;
  },
}));

import { RunJSSourceResolverRegistry } from '../../components/runjs-source';
import { linkageRunjs } from '../linkageRules';

type LinkageRunJSComponentProps = {
  value?: unknown;
  onChange?: (value: unknown) => void;
  linkageRuleIndex?: number;
  linkageActionIndex?: number;
};

describe('linkageRunjs', () => {
  afterEach(() => {
    mocks.runJSValueEditor.mockClear();
    RunJSSourceResolverRegistry.clear();
    vi.restoreAllMocks();
  });

  it('normalizes legacy script values and persists the complete RunJSValue with a nested source locator', () => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'form-block-runjs', flowEngine: engine });
    model.context.defineProperty('flowKey', { value: 'eventSettings' });
    model.context.defineProperty('currentStep', { value: { key: 'linkageRules' } });
    const onChange = vi.fn();
    const Component = linkageRunjs.uiSchema?.value?.['x-component'] as React.ComponentType<LinkageRunJSComponentProps>;

    render(
      <FlowSettingsContextProvider value={model.context}>
        <Component
          value={{ script: 'return ctx.formValues.amount;' }}
          onChange={onChange}
          linkageRuleIndex={2}
          linkageActionIndex={3}
        />
      </FlowSettingsContextProvider>,
    );

    const editorProps = mocks.runJSValueEditor.mock.calls.at(-1)?.[0];
    expect(editorProps?.value).toEqual({
      code: 'return ctx.formValues.amount;',
      version: 'v2',
    });
    expect(editorProps?.sourceLocator).toEqual({
      kind: 'flowModel.nestedRunJS',
      modelUid: 'form-block-runjs',
      containerFlowKey: 'eventSettings',
      containerStepKey: 'linkageRules',
      valuePath: ['value', 2, 'actions', 3, 'params', 'value'],
      scene: 'linkage',
    });

    const nextValue: RunJSValue = {
      code: '',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'repo-1',
        entryId: 'entry-1',
        kind: 'runjs',
      },
      settings: { currency: 'USD' },
    };
    (editorProps?.onChange as ((value: RunJSValue) => void) | undefined)?.(nextValue);

    expect(onChange).toHaveBeenCalledWith(nextValue);
  });

  it('executes legacy script values through the RunJSValue runtime', async () => {
    const runjs = vi.fn(async () => ({ success: true, value: 7 }));
    const ctx = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'form-block-runjs', use: 'FormBlockModel' } });
    ctx.defineMethod('runjs', runjs);

    await linkageRunjs.handler(ctx, {
      value: { script: 'return 7;' },
    });

    expect(runjs).toHaveBeenCalledWith('return 7;', undefined, { version: 'v2' });
  });

  it('resolves light-extension code and settings before execution', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: (input) => ({
        code: 'return `${ctx.settings.currency}:${ctx.formValues.amount}`;',
        version: 'v2',
        settings: input.settings,
      }),
    });

    const runjs = vi.fn(async function (this: { settings?: Record<string, unknown> }, code: string) {
      return {
        success: true,
        value: `${this.settings?.currency}:12:${code.includes('formValues.amount')}`,
      };
    });
    const ctx = new FlowContext();
    ctx.defineProperty('model', { value: { uid: 'form-block-runjs', use: 'FormBlockModel' } });
    ctx.defineProperty('formValues', { value: { amount: 12 } });
    ctx.defineMethod('runjs', runjs);

    await linkageRunjs.handler(ctx, {
      value: {
        code: '',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo-1',
          entryId: 'entry-1',
          kind: 'runjs',
        },
        settings: { currency: 'USD' },
      },
    });

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(runjs).toHaveBeenCalledWith('return `${ctx.settings.currency}:${ctx.formValues.amount}`;', undefined, {
      version: 'v2',
    });
  });

  it('shows a runtime error without rejecting the linkage flow', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: (input) => ({
        code: 'throw new Error("boom");',
        version: 'v2',
        sourceMap: { entryPath: 'src/client/runjs/check/index.ts' },
        settings: input.settings,
        context: input.context,
      }),
    });

    const message = { error: vi.fn() };
    const ctx = new FlowContext();
    ctx.defineProperty('flowKey', { value: 'eventSettings' });
    ctx.defineProperty('currentStep', { value: { key: 'linkageRules' } });
    ctx.defineProperty('model', { value: { uid: 'form-block-runjs', use: 'FormBlockModel' } });
    ctx.defineProperty('message', { value: message });
    ctx.defineProperty('t', { value: (key: string) => key });
    ctx.defineMethod('runjs', async () => ({ success: false, error: new Error('boom') }));
    ctx.__linkageRunJSOwnerPath = { ruleIndex: 1, actionIndex: 2 };

    await linkageRunjs.handler(ctx, {
      value: {
        code: '',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo-1',
          entryId: 'entry-1',
          kind: 'runjs',
        },
        settings: { enabled: true },
      },
    });

    expect(message.error).toHaveBeenCalledWith('RunJS execution failed');
  });
});
