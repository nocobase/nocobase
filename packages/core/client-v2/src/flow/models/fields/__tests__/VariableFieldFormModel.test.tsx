/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { InputFieldModel } from '../InputFieldModel';
import { VariableFieldFormModel } from '../VariableFieldFormModel';

describe('VariableFieldFormModel', () => {
  it('uses DOM-safe name and id for temporary controls created from reserved form property names', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ InputFieldModel, VariableFieldFormModel });
    const model = engine.createModel<VariableFieldFormModel>({
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            use: 'InputFieldModel',
            stepParams: {
              fieldSettings: {
                init: {
                  fieldPath: 'nodeName',
                },
              },
            },
          },
        ],
      },
    });
    const field = model.subModels.fields[0];

    render(<FlowEngineProvider engine={engine}>{model.render()}</FlowEngineProvider>);

    const input = await screen.findByRole('textbox');
    await waitFor(() => {
      expect(field.props.name).toEqual(['__nb_variable_field_nodeName']);
    });
    expect(input).toHaveAttribute('name', '__nb_variable_field_nodeName');
    expect(input).toHaveAttribute('id', '__nb_variable_field_nodeName');
    expect(field.props.id).toEqual(['__nb_variable_field_nodeName']);
    expect(field.getStepParams('fieldSettings', 'init')).toEqual({ fieldPath: 'nodeName' });
  });
});
