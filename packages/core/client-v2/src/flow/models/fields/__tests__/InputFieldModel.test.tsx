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
import { InputFieldModel } from '../InputFieldModel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function createInputFieldModel(props?: Record<string, unknown>) {
  const engine = new FlowEngine();
  return new InputFieldModel({
    uid: 'input-field-model-test',
    flowEngine: engine,
    props,
  });
}

describe('InputFieldModel', () => {
  it('renders the normal input when scan input is disabled', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const model = createInputFieldModel({ disableManualInput: true, enableScan: false, titleField: 'nickname' });

    render(<>{model.render()}</>);

    expect(screen.getByRole('textbox')).not.toHaveAttribute('titleField');
    expect(screen.queryByRole('button', { name: 'Scan to input' })).not.toBeInTheDocument();
    expect(consoleError.mock.calls.flat().map(String).join('\n')).not.toContain('titleField');
    expect(consoleError.mock.calls.flat().map(String).join('\n')).not.toContain('disableManualInput');

    consoleError.mockRestore();
  });

  it('keeps IME composition text visible before the parent value is committed', () => {
    const onChange = vi.fn();
    const onCompositionStart = vi.fn();
    const onCompositionEnd = vi.fn();
    const model = createInputFieldModel({
      value: '',
      onChange,
      onCompositionStart,
      onCompositionEnd,
    });

    render(<>{model.render()}</>);

    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'ni' }, nativeEvent: { isComposing: true } });

    expect(input.value).toBe('ni');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCompositionStart).toHaveBeenCalledTimes(1);

    fireEvent.compositionEnd(input, { target: { value: '你' } });

    expect(input.value).toBe('你');
    expect(onCompositionEnd).toHaveBeenCalledTimes(1);
  });

  it('returns to the committed parent value after IME composition is submitted', () => {
    const onChange = vi.fn();
    const onCompositionEnd = vi.fn();
    const createModel = (value: string) =>
      createInputFieldModel({
        value,
        onChange,
        onCompositionEnd,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'ni' }, nativeEvent: { isComposing: true } });
    fireEvent.compositionEnd(input, { target: { value: '你' } });

    expect(input.value).toBe('你');

    rerender(<>{createModel('你').render()}</>);

    expect(input.value).toBe('你');
  });

  it('does not overwrite in-progress DOM input with a stale parent value', async () => {
    const onChange = vi.fn();
    const createModel = (value: string) =>
      createInputFieldModel({
        value,
        onChange,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'té' } });
    rerender(<>{createModel('').render()}</>);

    expect(input.value).toBe('té');

    rerender(<>{createModel('reset').render()}</>);

    await waitFor(() => {
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('reset');
    });
  });

  it('keeps replacement-style Vietnamese IME edits in the DOM', () => {
    const onChange = vi.fn();
    const createModel = (value: string) =>
      createInputFieldModel({
        value,
        onChange,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'te' } });
    rerender(<>{createModel('te').render()}</>);
    expect(input.value).toBe('te');

    fireEvent.change(input, { target: { value: 'té' } });
    rerender(<>{createModel('te').render()}</>);
    expect(input.value).toBe('té');

    fireEvent.change(input, { target: { value: 'tét' } });
    rerender(<>{createModel('té').render()}</>);
    expect(input.value).toBe('tét');
  });

  it('does not overwrite local replacement edit when parent advances to an older value', () => {
    const onChange = vi.fn();
    const createModel = (value: string) =>
      createInputFieldModel({
        value,
        onChange,
      });

    const { rerender } = render(<>{createModel('').render()}</>);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'té' } });
    rerender(<>{createModel('t').render()}</>);

    expect(input.value).toBe('té');
  });

  it('renders ScanInput when scan input is enabled', () => {
    const model = createInputFieldModel({ enableScan: true });

    render(<>{model.render()}</>);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan to input' })).toBeInTheDocument();
  });

  it('stores enableScan and clears disableManualInput when scan input is turned off', () => {
    const model = createInputFieldModel();
    const step = model.getFlow('scanInputSettings')?.steps.enableScan;
    const setProps = vi.fn();

    step?.handler(
      {
        model: {
          props: { disableManualInput: true },
          setProps,
        },
      },
      { enableScan: false },
    );

    expect(setProps).toHaveBeenCalledWith({
      enableScan: false,
      disableManualInput: false,
    });
  });

  it('does not restore manual input disabling after scan input is turned off', () => {
    const model = createInputFieldModel({ enableScan: true, disableManualInput: true });
    const flow = model.getFlow('scanInputSettings');
    const ctx = { model };

    flow?.steps.enableScan.handler(ctx, { enableScan: false });
    flow?.steps.disableManualInput.handler(ctx, { disableManualInput: true });

    expect(model.props).toMatchObject({
      enableScan: false,
      disableManualInput: false,
    });
  });

  it('hides disableManualInput until scan input is enabled', () => {
    const model = createInputFieldModel();
    const step = model.getFlow('scanInputSettings')?.steps.disableManualInput;

    const hidden = step?.hideInSettings({
      model: {
        props: { enableScan: false },
        getProps: () => ({}),
      },
    });

    expect(hidden).toBe(true);
  });

  it('updates disableManualInput visibility from the current enableScan setting params', () => {
    const model = createInputFieldModel({ enableScan: false });
    const step = model.getFlow('scanInputSettings')?.steps.disableManualInput;

    model.setStepParams('scanInputSettings', 'enableScan', { enableScan: true });

    expect(step?.hideInSettings({ model })).toBe(false);

    model.setStepParams('scanInputSettings', 'enableScan', { enableScan: false });

    expect(step?.hideInSettings({ model })).toBe(true);
  });
});
