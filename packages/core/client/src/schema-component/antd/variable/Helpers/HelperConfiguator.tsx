/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, onFormValuesChange } from '@formily/core';
import { observer, useForm } from '@formily/react';
import { tval, uid } from '@nocobase/utils/client';
import { Tag } from 'antd';
import { createMemoryHistory } from 'history';
import debounce from 'lodash/debounce';
import React from 'react';
import { Router } from 'react-router-dom';
import { useApp } from '../../../../application';
import { SchemaComponent } from '../../../core/SchemaComponent';
import { useVariable } from '../VariableProvider';
import { helpersObs, rawHelpersObs, removeHelper } from './observables';

export const HelperConfiguator = observer(
  ({ index, close }: { index: number; close: () => void }) => {
    const app = useApp();
    const helper = helpersObs.value[index];
    const rawHelper = rawHelpersObs.value[index];
    const helperConfigs = app.jsonTemplateParser.filters;
    const helperConfig = helperConfigs.find((item) => item.name === helper.name);
    const history = createMemoryHistory();
    const previousHelpers = helpersObs.value.slice(0, index);
    const { value } = useVariable();
    const inputValue = previousHelpers.reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);
    const outputValue = helpersObs.value.slice(0, index + 1).reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);

    const InputValue = () => {
      return <Tag color="red">{JSON.stringify(inputValue).slice(1, -1)}</Tag>;
    };

    const OuputValue = () => {
      return <Tag color="green">{JSON.stringify(outputValue).slice(1, -1)}</Tag>;
    };

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
          close();
        },
      };
    };

    const useCloseActionProps = () => {
      return {
        onClick: async () => {
          close();
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
              'x-component': 'InputValue',
              'x-decorator': 'FormItem',
              title: tval('Input value', { ns: 'client' }),
            },
            ...Object.fromEntries(
              helperConfig.uiSchema.map((param) => [
                param.name,
                {
                  ...param,
                  'x-decorator': 'FormItem',
                },
              ]),
            ),
            '$output-value': {
              type: 'void',
              'x-component': 'OuputValue',
              'x-decorator': 'FormItem',
              title: tval('Output value', { ns: 'client' }),
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
                close: {
                  type: 'void',
                  title: tval('Close'),
                  'x-component': 'Action',
                  'x-use-component-props': 'useCloseActionProps',
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
          components={{ InputValue, OuputValue }}
          schema={schema}
          scope={{
            t: app.i18n.t,
            useFormBlockProps,
            useDeleteActionProps,
            useCloseActionProps,
          }}
          basePath={['']}
        />
      </Router>
    );
  },
  { displayName: 'Helper' },
);
