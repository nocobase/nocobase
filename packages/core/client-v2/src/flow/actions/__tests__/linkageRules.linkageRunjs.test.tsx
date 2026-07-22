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
    vi.restoreAllMocks();
  });

  it('normalizes legacy script values and keeps the editor inline-only', () => {
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
    expect(editorProps?.sourceLocator).toBeUndefined();

    const nextValue: RunJSValue = {
      code: 'return 8;',
      version: 'v2',
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
});
