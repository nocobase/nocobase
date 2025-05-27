/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useField, useFieldSchema } from '@formily/react';
import {
  ISchema,
  Plugin,
  SchemaSettingsModalItem,
  useColumnSchema,
  useDesignable,
  useIsFieldReadPretty,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';

// Import locale resources
import enUS from '../locale/en-US.json';
import zhCN from '../locale/zh-CN.json';

// Define namespace for i18n
const NAMESPACE = 'field-content-formatter';

// Custom preview component, which supports rich text and error prompts.
const FormatterPreview = ({ formatter, testValue }) => {
  const { t } = useTranslation(NAMESPACE);
  if (formatter && testValue) {
    return (
      <InputWithFormatter
        value={testValue}
        formatter={formatter}
        originalInput={({ _error }) => <div style={{ color: 'red' }}>{_error}</div>}
      />
    );
  } else {
    return <div style={{ color: '#999' }}>{t('Preview will appear here')}</div>;
  }
};

const SchemaSettingsInputFormat = function InputFormatConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation(NAMESPACE);
  const { formatter } = fieldSchema['x-component-props'] || {};

  return (
    <SchemaSettingsModalItem
      title={t('Field content formatter')}
      schema={
        {
          type: 'object',
          properties: {
            formatter: {
              type: 'string',
              title: t('Formatter'),
              'x-component': 'Input.TextArea',
              'x-decorator': 'FormItem',
              default: formatter,
              description: t(
                'JavaScript function that returns HTML string, e.g., (value) => `<strong>${value}</strong>`',
              ),
            },
            testValue: {
              type: 'string',
              title: t('Test Value'),
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            preview: {
              type: 'void',
              title: t('Preview'),
              'x-decorator': 'FormItem',
              'x-component': FormatterPreview,
              'x-reactions': {
                dependencies: ['formatter', 'testValue'],
                fulfill: {
                  schema: {
                    'x-component-props': '{{ $form.values }}',
                  },
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={(data) => {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'] = {
          ...(fieldSchema['x-component-props'] || {}),
          formatter: data.formatter,
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

const InputWithFormatter = (props) => {
  const { value, formatter, originalInput: OriginalInput } = props;

  try {
    const htmlContent = eval(formatter)(value);
    if (typeof htmlContent === 'string' && htmlContent.includes('<')) {
      return <HtmlRenderer content={htmlContent} />;
    }
    return <span>{htmlContent}</span>;
  } catch (error) {
    console.error('Formatter error:', error);
    return <OriginalInput {...props} _error={error.toString()} />;
  }
};

class PluginFieldContentFormatterClient extends Plugin {
  async load() {
    const addFormatterSetting = (componentType: string) => {
      this.schemaSettingsManager.addItem(`fieldSettings:component:${componentType}`, 'enableFormatter', {
        Component: SchemaSettingsInputFormat as any,
        useComponentProps() {
          const schema = useFieldSchema();
          const { fieldSchema: tableColumnSchema } = useColumnSchema();
          const fieldSchema = tableColumnSchema || schema;
          return {
            fieldSchema,
          };
        },
        useVisible() {
          const isFieldReadPretty = useIsFieldReadPretty();
          return isFieldReadPretty;
        },
      });
    };

    addFormatterSetting('Input');
    addFormatterSetting('InputNumber');

    const FormattedInput = (OriginalInput) => (props) => {
      if (props.formatter) {
        return <InputWithFormatter {...props} originalInput={OriginalInput} />;
      }
      return <OriginalInput {...props} />;
    };

    this.app.addComponents({
      Input: Object.assign(FormattedInput(this.app.components.Input), this.app.components.Input),
      InputNumber: Object.assign(FormattedInput(this.app.components.InputNumber), this.app.components.InputNumber),
    });
  }
}

export default PluginFieldContentFormatterClient;
