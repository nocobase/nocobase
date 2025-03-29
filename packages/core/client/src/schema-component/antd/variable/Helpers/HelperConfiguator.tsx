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
import { dayjs, tval, uid } from '@nocobase/utils/client';
import { Button, Card, Space, Tag } from 'antd';
import { createMemoryHistory } from 'history';
import debounce from 'lodash/debounce';
import minimatch from 'minimatch';
import React from 'react';
import { Router, useLocation } from 'react-router-dom';
import { useApp } from '../../../../application';
import { SchemaComponent } from '../../../core/SchemaComponent';
import { useCurrentVariable, VariableHelperMapping } from '../VariableProvider';

const displayValue = (val) => {
  if (dayjs.isDayjs(val)) {
    return val.toDate().toLocaleString();
  } else return val;
};
/**
 * Escapes special glob characters in a string
 * @param str The string to escape
 * @returns The escaped string
 */
function escapeGlob(str: string): string {
  return str.replace(/[?$[\](){}!|+@\\]/g, '\\$&');
}

/**
 * Tests if a filter is allowed for a given variable based on the variableHelperMapping configuration
 * @param variableName The name of the variable to test
 * @param filterName The name of the filter to test
 * @param mapping The variable helper mapping configuration
 * @returns boolean indicating if the filter is allowed for the variable
 */
export function isFilterAllowedForVariable(
  variableName: string,
  filterName: string,
  mapping?: VariableHelperMapping,
): boolean {
  if (!mapping?.rules) {
    return true; // If no rules defined, allow all filters
  }

  // Check each rule
  for (const rule of mapping.rules) {
    // Check if variable matches the pattern
    // We don't escape the pattern since it's meant to be a glob pattern
    // But we escape the variable name since it's a literal value
    if (minimatch(escapeGlob(variableName), rule.variable)) {
      // Check if filter matches any of the allowed patterns
      return rule.helpers.some((pattern) => minimatch(filterName, pattern));
    }
  }

  // If no matching rule found and strictMode is true, deny the filter
  return !mapping.strictMode;
}

const Configurator = observer(
  ({ index, close }: { index: number; close: () => void }) => {
    const app = useApp();
    const { value, helperObservables } = useCurrentVariable();

    const { helpersObs, rawHelpersObs, removeHelper } = helperObservables;
    const helper = helpersObs.value[index];
    const rawHelper = rawHelpersObs.value[index];
    const helperConfigs = app.jsonTemplateParser.helpers;
    const helperConfig = helperConfigs.find((item) => item.name === helper.name);
    const HelperComponent = helperConfig.Component;
    const previousHelpers = helpersObs.value.slice(0, index);
    const inputValue = previousHelpers.reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);
    const outputValue = helpersObs.value.slice(0, index + 1).reduce((value, helper) => {
      return helper.handler(value, ...helper.args);
    }, value);

    const InputValue = () => {
      return <Tag color="red">{displayValue(inputValue)}</Tag>;
    };

    const OuputValue = () => {
      return <Tag color="green">{displayValue(outputValue)}</Tag>;
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
              helperConfig.uiSchema
                ? helperConfig.uiSchema.map((param) => [
                    param.name,
                    {
                      ...param,
                      'x-decorator': 'FormItem',
                    },
                  ])
                : [],
            ),
            '$output-value': {
              type: 'void',
              'x-component': 'OuputValue',
              'x-decorator': 'FormItem',
              title: tval('Output value', { ns: 'client' }),
            },
          },
        },
      },
    };

    return (
      <>
        {HelperComponent ? (
          <HelperComponent
            value={helper.argsMap}
            onChange={(values) => (rawHelper.argsMap = values)}
            inputValue={inputValue}
          />
        ) : (
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
        )}
        <MyButtons onDelete={() => removeHelper({ index: index })} onClose={close} />
      </>
    );
  },
  { displayName: 'Configurator' },
);

// Add a new component for custom delete and close buttons
export const MyButtons = observer(
  ({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) => {
    const app = useApp();
    const t = app.i18n.t;
    return (
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button type="primary" danger onClick={onDelete}>
          {t('Delete', { ns: 'client' })}
        </Button>
        <Button onClick={onClose}>{t('Close', { ns: 'client' })}</Button>
      </Space>
    );
  },
  { displayName: 'MyButtons' },
);

const WithRouter = observer(
  ({ children }: { children: React.ReactNode }) => {
    const history = createMemoryHistory();
    return (
      <Router location={history.location} navigator={history}>
        {children}
      </Router>
    );
  },
  { displayName: 'WithRouter' },
);

export const HelperConfiguator = observer(
  (props: { index: number; close: () => void }) => {
    try {
      useLocation();
      return <Configurator {...props} />;
    } catch (error) {
      return (
        <WithRouter>
          <Configurator {...props} />
        </WithRouter>
      );
    }
  },
  { displayName: 'HelperConfiguator' },
);
