/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { FlowEngineProvider } from '../../provider';
import { FieldModelRenderer } from '../FieldModelRenderer';

class InputModel extends FlowModel {
  render(): React.ReactNode {
    return (
      <input
        data-testid="field-input"
        value={this.props.value ?? ''}
        onChange={this.props.onChange}
        onCompositionStart={this.props.onCompositionStart}
        onCompositionEnd={this.props.onCompositionEnd}
      />
    );
  }
}

describe('FieldModelRenderer', () => {
  it('updates model and form value for normal input changes', async () => {
    const flowEngine = new FlowEngine();
    const model = new InputModel({
      uid: 'normal-input-field-model',
      flowEngine,
      props: {
        value: '',
      },
    });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={flowEngine}>
        <FieldModelRenderer model={model} onChange={onChange} />
      </FlowEngineProvider>,
    );

    const input = await screen.findByTestId('field-input');
    await waitFor(() => {
      expect(model.props.onChange).toBeTypeOf('function');
    });

    fireEvent.change(input, { target: { value: 'abc' } });

    expect(model.props.value).toBe('abc');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('updates model and form value when field components pass values directly', async () => {
    const flowEngine = new FlowEngine();
    const model = new InputModel({
      uid: 'direct-value-field-model',
      flowEngine,
      props: {
        value: '',
      },
    });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={flowEngine}>
        <FieldModelRenderer model={model} onChange={onChange} />
      </FlowEngineProvider>,
    );

    await screen.findByTestId('field-input');
    await waitFor(() => {
      expect(model.props.onChange).toBeTypeOf('function');
    });

    act(() => {
      model.props.onChange(123);
    });

    expect(model.props.value).toBe(123);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(123);
  });

  it('defers model and form value updates while IME composition is active', async () => {
    const flowEngine = new FlowEngine();
    const model = new InputModel({
      uid: 'input-field-model',
      flowEngine,
      props: {
        value: '',
      },
    });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={flowEngine}>
        <FieldModelRenderer model={model} onChange={onChange} />
      </FlowEngineProvider>,
    );

    const input = await screen.findByTestId('field-input');
    await waitFor(() => {
      expect(model.props.onChange).toBeTypeOf('function');
    });

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 't' }, nativeEvent: { isComposing: true } });

    expect(model.props.value).toBe('');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { target: { value: 'te' } });

    expect(model.props.value).toBe('te');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('te');
  });

  it('does not commit composition value when composition end opts out', async () => {
    const flowEngine = new FlowEngine();
    const model = new InputModel({
      uid: 'composition-opt-out-field-model',
      flowEngine,
      props: {
        value: '',
      },
    });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={flowEngine}>
        <FieldModelRenderer model={model} onChange={onChange} />
      </FlowEngineProvider>,
    );

    await screen.findByTestId('field-input');
    await waitFor(() => {
      expect(model.props.onChange).toBeTypeOf('function');
      expect(model.props.onCompositionStart).toBeTypeOf('function');
      expect(model.props.onCompositionEnd).toBeTypeOf('function');
    });

    act(() => {
      model.props.onCompositionStart();
      model.props.onChange({ target: { value: 'search' }, nativeEvent: { isComposing: true } });
      model.props.onCompositionEnd({ target: { value: 'search' } }, false);
    });

    expect(model.props.value).toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });
});
