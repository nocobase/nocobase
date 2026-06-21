/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextareaFieldModel } from '../TextareaFieldModel';

function createTextareaFieldModel(props?: Record<string, unknown>) {
  const engine = new FlowEngine();
  return new TextareaFieldModel({
    uid: 'textarea-field-model-test',
    flowEngine: engine,
    props,
  });
}

describe('TextareaFieldModel', () => {
  it('keeps IME composition text visible before the parent value is committed', () => {
    const onChange = vi.fn();
    const onCompositionStart = vi.fn();
    const onCompositionEnd = vi.fn();
    const model = createTextareaFieldModel({
      value: '',
      onChange,
      onCompositionStart,
      onCompositionEnd,
    });

    render(<>{model.render()}</>);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    fireEvent.compositionStart(textarea);
    fireEvent.change(textarea, { target: { value: 'ni' }, nativeEvent: { isComposing: true } });

    expect(textarea.value).toBe('ni');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCompositionStart).toHaveBeenCalledTimes(1);

    fireEvent.compositionEnd(textarea, { target: { value: '你' } });

    expect(textarea.value).toBe('你');
    expect(onCompositionEnd).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite in-progress DOM input with a stale parent value', async () => {
    const onChange = vi.fn();
    const createModel = (value: string) =>
      createTextareaFieldModel({
        value,
        onChange,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'té' } });
    rerender(<>{createModel('').render()}</>);

    expect(textarea.value).toBe('té');

    rerender(<>{createModel('reset').render()}</>);

    await waitFor(() => {
      expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('reset');
    });
  });

  it('keeps replacement-style Vietnamese IME edits in the DOM', () => {
    const onChange = vi.fn();
    const createModel = (value: string) =>
      createTextareaFieldModel({
        value,
        onChange,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'te' } });
    rerender(<>{createModel('te').render()}</>);
    expect(textarea.value).toBe('te');

    fireEvent.change(textarea, { target: { value: 'té' } });
    rerender(<>{createModel('te').render()}</>);
    expect(textarea.value).toBe('té');

    fireEvent.change(textarea, { target: { value: 'tét' } });
    rerender(<>{createModel('té').render()}</>);
    expect(textarea.value).toBe('tét');
  });
});
