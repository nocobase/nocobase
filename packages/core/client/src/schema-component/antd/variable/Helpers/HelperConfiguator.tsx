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
import React, { useCallback } from 'react';
import { Router, useLocation } from 'react-router-dom';
import { useApp } from '../../../../application';
import { SchemaComponent } from '../../../core/SchemaComponent';
import { useCurrentVariable, VariableHelperMapping } from '../VariableProvider';

const displayValue = (val) => {
  if (dayjs.isDayjs(val)) {
    return val.utc().format();
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
 * Tests if a helper is allowed for a given variable based on the variableHelperMapping configuration
 * @param variableName The name of the variable to test
 * @param helperName The name of the helper to test
 * @param mapping The variable helper mapping configuration
 * @returns boolean indicating if the helper is allowed for the variable
 */
export function isHelperAllowedForVariable(
  variableName: string,
  helperName: string,
  mapping?: VariableHelperMapping,
): boolean {
  if (!mapping?.rules) {
    return true; // If no rules defined, allow all helpers
  }

  // Check each rule
  for (const rule of mapping.rules) {
    // Check if variable matches the pattern
    // We don't escape the pattern since it's meant to be a glob pattern
    // But we escape the variable name since it's a literal value
    if (minimatch(escapeGlob(variableName), rule.variable)) {
      // Check if helper matches any of the allowed patterns
      return rule.helpers.some((pattern) => minimatch(helperName, pattern));
    }
  }

  // If no matching rule found and strictMode is true, deny the helper
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
    const onChange = useCallback(
      (values) => {
        rawHelper.argsMap = values;
      },
      [rawHelper],
    );
    const InputValue = () => {
      return (
        <div>
          <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>Input: </div>
          <Tag color="red">{displayValue(inputValue)}</Tag>
        </div>
      );
    };

    const OuputValue = () => {
      return (
        <div>
          <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>Output: </div>
          <Tag color="green">{displayValue(outputValue)}</Tag>
        </div>
      );
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
          },
        },
      },
    };

    return (
      <>
        <InputValue />
        {HelperComponent ? (
          <HelperComponent value={helper.argsMap} onChange={onChange} inputValue={inputValue} />
        ) : (
          <SchemaComponent
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
        <OuputValue />
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
        <Button type="primary" onClick={onClose}>
          {t('Submit', { ns: 'client' })}
        </Button>
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
