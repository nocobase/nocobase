/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { NodeContext } from '@nocobase/plugin-workflow/client';
import { LegacyRunJSEditorRegistry } from '@nocobase/plugin-vsc-file/client';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ScriptInstruction from '../ScriptInstruction';
import { WorkflowRunJSEditorField } from '../WorkflowRunJSEditorField';

vi.mock('../CodeEditor', () => ({
  default: ({
    value,
    onChange,
    disabled,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <textarea
      aria-label="workflow-code-fallback"
      disabled={disabled}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow-javascript',
  lang: (key: string) => key,
  usePluginTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('WorkflowRunJSEditorField', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
  });

  it('falls back to the legacy CodeEditor when no VSC provider is registered', () => {
    const onChange = vi.fn();

    render(
      <NodeContext.Provider value={{ id: 12 }}>
        <WorkflowRunJSEditorField value="return old;" onChange={onChange} />
      </NodeContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText('workflow-code-fallback'), {
      target: {
        value: 'return fallback;',
      },
    });

    expect(onChange).toHaveBeenCalledWith('return fallback;');
  });

  it('passes a workflow.javascript locator to the provider and syncs published code into the form value', () => {
    const onChange = vi.fn();
    let capturedLocator: unknown;

    LegacyRunJSEditorRegistry.registerProvider({
      key: 'test-provider',
      renderEditor: (props) => {
        capturedLocator = props.locator;
        return (
          <button type="button" onClick={() => props.onChange?.({ code: 'return published;', version: 'workflow-js' })}>
            {`${props.label} / ${props.sourceLabel}`}
          </button>
        );
      },
    });

    render(
      <NodeContext.Provider value={{ id: 'node-1' }}>
        <WorkflowRunJSEditorField value="return old;" onChange={onChange} />
      </NodeContext.Provider>,
    );

    expect(capturedLocator).toEqual({
      kind: 'workflow.javascript',
      nodeId: 'node-1',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Workflow JavaScript / Script content' }));

    expect(onChange).toHaveBeenCalledWith('return published;');
    expect(screen.queryByLabelText('workflow-code-fallback')).toBeNull();
  });

  it('registers the workflow content schema with the v1 wrapper instead of the v2 editor', () => {
    const instruction = new ScriptInstruction();

    expect(instruction.fieldset.content['x-component']).toBe('WorkflowRunJSEditorField');
    expect(instruction.components.WorkflowRunJSEditorField).toBeDefined();
  });
});
