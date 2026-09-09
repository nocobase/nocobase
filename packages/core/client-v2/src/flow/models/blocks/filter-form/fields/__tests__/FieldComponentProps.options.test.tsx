/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { createForm } from '@formily/core';
import { Field, FormProvider } from '@formily/react';
import { render, screen } from '@nocobase/test/client';
import userEvent from '@testing-library/user-event';
import { FlowEngine, FlowEngineProvider, FlowModel, FlowModelProvider } from '@nocobase/flow-engine';
import { FieldComponentProps } from '../FieldComponentProps';

class HostModel extends FlowModel {
  render() {
    return null;
  }
}

describe.each(['RadioGroupFieldModel', 'CheckboxGroupFieldModel', 'SelectFieldModel'])('%s options', (fieldModel) => {
  it('keeps focus while editing option values and preserves remaining rows after removal', async () => {
    const form = createForm();
    const engine = new FlowEngine();
    engine.registerModels({ HostModel });
    const model = engine.createModel<HostModel>({ use: 'HostModel' });
    render(
      <FlowEngineProvider engine={engine}>
        <FlowModelProvider model={model}>
          <FormProvider form={form}>
            <Field name="props" component={[FieldComponentProps, { fieldModel, source: [] }]} />
          </FormProvider>
        </FlowModelProvider>
      </FlowEngineProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'plus Add' }));
    const valueInput = screen.getByPlaceholderText('Option value');
    await userEvent.type(valueInput, 'abcdef');
    expect(screen.getByPlaceholderText('Option value')).toHaveValue('abcdef');
    expect(valueInput).toHaveFocus();

    await userEvent.keyboard('{Backspace}{Backspace}xy');
    expect(valueInput).toHaveValue('abcdxy');
    expect(valueInput).toHaveFocus();
    await userEvent.type(screen.getByPlaceholderText('Option label'), 'First');
    await userEvent.click(screen.getByRole('button', { name: 'plus Add' }));
    await userEvent.type(screen.getAllByPlaceholderText('Option label')[1], 'Second');
    await userEvent.type(screen.getAllByPlaceholderText('Option value')[1], 'second');
    await userEvent.click(screen.getAllByRole('button', { name: 'close' })[0]);
    expect(screen.getByPlaceholderText('Option label')).toHaveValue('Second');
    expect(screen.getByPlaceholderText('Option value')).toHaveValue('second');
    await userEvent.type(screen.getByPlaceholderText('Option value'), '2');
    expect(screen.getByPlaceholderText('Option value')).toHaveFocus();
    expect(form.values.props.options).toEqual([{ label: 'Second', value: 'second2' }]);
  });
});
