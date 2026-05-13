/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { FlowEngineProvider } from '../../provider';
import { FieldModelRenderer } from '../FieldModelRenderer';

class InputModel extends FlowModel {
  render(): any {
    const props = this.props as any;
    return (
      <input
        aria-label="ime-input"
        value={props.value ?? ''}
        onChange={props.onChange}
        onCompositionStart={props.onCompositionStart}
        onCompositionUpdate={props.onCompositionUpdate}
        onCompositionEnd={props.onCompositionEnd}
      />
    );
  }
}

describe('FieldModelRenderer', () => {
  const renderWithProvider = (engine: FlowEngine, ui: React.ReactNode) => {
    return render(<FlowEngineProvider engine={engine}>{ui}</FlowEngineProvider>);
  };

  test('should defer onChange during IME composition and emit value on compositionend', async () => {
    const engine = new FlowEngine();
    const model = new InputModel({ uid: 'ime-model', flowEngine: engine });
    model.dispatchEvent = vi.fn().mockResolvedValue([]);
    const onChange = vi.fn();

    renderWithProvider(engine, <FieldModelRenderer model={model as any} onChange={onChange} />);

    const input = await screen.findByLabelText('ime-input');

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'a  ' }, nativeEvent: { isComposing: true } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { target: { value: 'a ' } });
    fireEvent.change(input, { target: { value: 'a ' }, nativeEvent: { isComposing: false } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith('a ');
    });
  });
});
