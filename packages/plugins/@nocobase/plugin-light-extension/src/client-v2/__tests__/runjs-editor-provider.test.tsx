/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createRunJSLightExtensionEditorProvider } from '../components/RunJSLightExtensionEditorProvider';

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    CodeEditor: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
      <textarea aria-label="runjs-code" value={value || ''} onChange={(event) => onChange?.(event.target.value)} />
    ),
  };
});

vi.mock('../components/JSBlockLightExtensionSourceField', () => ({
  RunJSLightExtensionSourceField: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <button type="button" onClick={() => onChange?.('light-extension')}>
      source:{value || 'inline'}
    </button>
  ),
}));

describe('RunJSLightExtensionEditorProvider', () => {
  it('only handles nested RunJS locators and preserves inline edits', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onChange = vi.fn();
    const nestedLocator = {
      kind: 'flowModel.nestedRunJS' as const,
      modelUid: 'form_1',
      containerFlowKey: 'formModelSettings',
      containerStepKey: 'assignRules',
      valuePath: ['value', 0, 'value'],
      scene: 'formValue',
    };

    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: nestedLocator,
        surfaceStyle: 'value',
      }),
    ).toBe(true);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: nestedLocator,
        surfaceStyle: 'action',
      }),
    ).toBe(false);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: {
          kind: 'flowModel.step',
          modelUid: 'model_1',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        surfaceStyle: 'value',
      }),
    ).toBe(false);

    render(
      <>
        {provider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator: nestedLocator,
          surfaceStyle: 'value',
          onChange,
        })}
      </>,
    );

    fireEvent.change(screen.getByLabelText('runjs-code'), {
      target: { value: 'return 2;' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        code: 'return 2;',
        version: 'v2',
        sourceMode: 'inline',
      });
    });
  });
});
