/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useForm, observer } from '@formily/react';
import { createForm, onFormValuesChange } from '@formily/core';
import { uid, tval } from '@nocobase/utils/client';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { SchemaComponent } from '../../../core';
import { helpersObs, rawHelpersObs, removeHelper } from './observables';
import { useVariable } from '../VariableProvider';
import debounce from 'lodash/debounce';

export const HelperConfiguator = observer(
  ({ index, onDelete }: { index: number; onDelete: () => void }) => {
    const helper = helpersObs.value[index];
    const rawHelper = rawHelpersObs.value[index];
    const config = helper.config;
    const history = createMemoryHistory();
    const previousHelpers = helpersObs.value.slice(0, index);
    const { value } = useVariable();
    const inputValue = previousHelpers.reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);
    const outputValue = helpersObs.value.slice(0, index + 1).reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);

    const useFormBlockProps = () => {
      return {
        form: createForm({
          initialValues: helper.argsMap,
          effects() {
            onFormValuesChange(
              debounce((form) => {
                rawHelper.argsMap = form.values;
              }, 500),
            );
          },
        }),
        layout: 'vertical',
      };
    };

    const useDeleteActionProps = () => {
      const form = useForm();
      return {
        type: 'primary',
        danger: true,
        onClick: async () => {
          removeHelper({ index: index });
          onDelete();
        },
      };
    };

    const schema = {
      'x-uid': uid(),
      type: 'void',
      'x-component': 'CardItem',
      properties: {
        form: {
          'x-uid': uid(),
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormBlockProps',
          properties: {
            '$input-value': {
              type: 'void',
              'x-component': 'div',
              'x-content': '{{ inputValue }}',
              'x-decorator': 'FormItem',
              title: tval('Input Value'),
            },
            ...Object.fromEntries(
              config.uiSchema.map((param) => [
                param.name,
                {
                  ...param,
                  'x-decorator': 'FormItem',
                },
              ]),
            ),
            '$return-value': {
              type: 'void',
              'x-component': 'div',
              'x-content': '{{ outputValue }}',
              'x-decorator': 'FormItem',
              title: tval('Return Value'),
            },
            actions: {
              type: 'void',
              title: tval('Save'),
              'x-component': 'ActionBar',
              properties: {
                delete: {
                  type: 'void',
                  title: tval('Delete'),
                  'x-component': 'Action',
                  'x-use-component-props': 'useDeleteActionProps',
                },
              },
            },
          },
        },
      },
    };
    return (
      <Router location={history.location} navigator={history}>
        <SchemaComponent
          schema={schema}
          scope={{
            useFormBlockProps,
            useDeleteActionProps,
            outputValue: JSON.stringify(outputValue),
            inputValue: JSON.stringify(inputValue),
          }}
          basePath={['']}
        />
      </Router>
    );
  },
  { displayName: 'Helper' },
);
