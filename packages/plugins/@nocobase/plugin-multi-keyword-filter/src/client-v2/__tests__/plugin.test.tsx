/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, InputFieldInterface } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MultipleKeywordsInput } from '../MultipleKeywordsInput';
import PluginFilterOperatorMultipleKeywordsClient from '../plugin';

type FilterOperator = {
  value: string;
  schema?: Record<string, unknown>;
};

describe('PluginFilterOperatorMultipleKeywordsClient v2', () => {
  it('registers multi-keyword operators and the value input component', async () => {
    const app = new Application({
      plugins: [PluginFilterOperatorMultipleKeywordsClient],
    });
    const addFieldInterfaceOperator = vi.spyOn(app, 'addFieldInterfaceOperator');
    const addComponents = vi.spyOn(app, 'addComponents');

    await app.load();

    expect(addComponents).toHaveBeenCalledWith({ MultipleKeywordsInput });
    expect(app.getComponent('MultipleKeywordsInput')).toBe(MultipleKeywordsInput);
    const inputInOperator = addFieldInterfaceOperator.mock.calls.find(
      ([interfaceName, operator]) => interfaceName === 'input' && operator.value === '$in',
    )?.[1];
    expect(React.isValidElement(inputInOperator?.label)).toBe(true);
    const { container } = render(
      <FlowEngineProvider engine={app.flowEngine}>{inputInOperator?.label}</FlowEngineProvider>,
    );
    expect(container.querySelector('.anticon-question-circle')).toBeTruthy();
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'input',
      expect.objectContaining({
        value: '$in',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'input',
          },
        },
      }),
    );
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'input',
      expect.objectContaining({
        value: '$notIn',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'input',
          },
        },
      }),
    );
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'id',
      expect.objectContaining({
        value: '$in',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'id',
          },
        },
      }),
    );
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'id',
      expect.objectContaining({
        value: '$notIn',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'id',
          },
        },
      }),
    );
  });

  it('applies queued multi-keyword operators when field interfaces register later', async () => {
    const app = new Application({
      plugins: [PluginFilterOperatorMultipleKeywordsClient],
    });

    await app.load();
    app.addFieldInterfaces([InputFieldInterface]);

    const inputInterface = app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface('input');
    const operators = inputInterface.filterable.operators as FilterOperator[];
    const inOperator = operators.find((item) => item.value === '$in');
    const notInOperator = operators.find((item) => item.value === '$notIn');

    expect(inOperator?.schema?.['x-component']).toBe('MultipleKeywordsInput');
    expect(notInOperator?.schema?.['x-component']).toBe('MultipleKeywordsInput');
  });
});
