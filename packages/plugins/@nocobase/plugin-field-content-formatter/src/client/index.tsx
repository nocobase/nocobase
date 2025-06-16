/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  ISchema,
  Plugin,
  SchemaSettingsModalItem,
  SchemaSettingsSwitchItem,
  useCollectionRecord,
  useDesignable,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HtmlRenderer } from './HtmlRenderer';

// Define namespace for i18n
const NAMESPACE = 'field-content-formatter';

// Custom preview component, which supports rich text and error prompts.
const FormatterPreview = ({ formatter, testValue }) => {
  const { t } = useTranslation(NAMESPACE);
  if (formatter && testValue) {
    let jsonValue = null;
    try {
      jsonValue = JSON.parse(testValue);
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    if (!jsonValue) {
      return <div style={{ color: 'red' }}>{t('Invalid JSON string')}</div>;
    }
    const { objectValue, fieldValue } = jsonValue;
    return (
      <HTMLFormatter
        objectValue={objectValue}
        fieldValue={fieldValue}
        formatter={formatter}
        backupComponent={({ _error }) => <div style={{ color: 'red' }}>{_error}</div>}
      />
    );
  } else {
    return <div style={{ color: '#999' }}>{t('Preview will appear here')}</div>;
  }
};

const SchemaSettingsEnableFormatter = () => {
  const { t } = useTranslation(NAMESPACE);
  const columnSchema = useFieldSchema();
  const [fieldSchema] = Object.values(columnSchema.properties);
  const componentProps = fieldSchema['x-component-props'] ?? {};
  const field = useField();
  const { dn } = useDesignable();
  return (
    <SchemaSettingsSwitchItem
      title={t('Enable custom formatter')}
      checked={componentProps.enableCustomFormatter}
      onChange={(v) => {
        if (!v) {
          delete componentProps.formatter;
          delete componentProps.component;
        }
        field.componentProps.enableCustomFormatter = v;
        componentProps.enableCustomFormatter = v;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': componentProps,
          },
        });
        dn.refresh();
      }}
    />
  );
};

const SchemaSettingsCustomFormatter = () => {
  const { t } = useTranslation(NAMESPACE);
  const columnSchema = useFieldSchema();
  const [fieldSchema] = Object.values(columnSchema.properties);
  const componentProps = fieldSchema['x-component-props'] ?? {};
  const field = useField();
  const { dn } = useDesignable();
  const { formatter, enableCustomFormatter } = componentProps;
  const isFieldReadPretty = fieldSchema['x-read-pretty'] ?? false;
  return (
    <SchemaSettingsModalItem
      title={t('Custom formatter')}
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
                'JavaScript function that returns HTML string, e.g., (objectValue, fieldValue) => `<strong>${fieldValue}</strong>`',
              ),
            },
            testValue: {
              type: 'string',
              title: t('Test Value'),
              'x-component': 'Input',
              'x-decorator': 'FormItem',
              description: t('JSON string, e.g., {"objectValue": {"name": "John"}, "fieldValue": "John"}'),
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
      hidden={!(enableCustomFormatter && isFieldReadPretty)}
      onSubmit={(data) => {
        componentProps.component = 'CustomFieldFormatterComponent';
        componentProps.formatter = data.formatter;
        field.componentProps = componentProps;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': componentProps,
          },
        });
        dn.refresh();
      }}
    />
  );
};

const CustomFieldFormatterComponent = () => {
  const record = useCollectionRecord();
  const fieldSchema = useFieldSchema();
  const field = useField();
  return (
    <HTMLFormatter
      objectValue={record?.data}
      fieldValue={field?.['value']}
      formatter={(fieldSchema['x-component-props'] ?? {}).formatter}
      backupComponent={({ _error }) => <div style={{ color: 'red' }}>{_error}</div>}
    />
  );
};
CustomFieldFormatterComponent.displayName = 'CustomFieldFormatterComponent';

const HTMLFormatter = (props) => {
  const { objectValue, fieldValue, formatter, backupComponent: BackupComponent } = props;
  try {
    const htmlContent = eval(formatter)(objectValue, fieldValue);
    if (typeof htmlContent === 'string' && htmlContent.includes('<')) {
      return <HtmlRenderer content={htmlContent} />;
    }
    return <span>{htmlContent}</span>;
  } catch (error) {
    console.error('Formatter error:', error);
    return <BackupComponent {...props} _error={error.toString()} />;
  }
};

class PluginFieldContentFormatterClient extends Plugin {
  async load() {
    this.app.addComponents({
      CustomFieldFormatterComponent: CustomFieldFormatterComponent,
    });
    this.schemaSettingsManager.addItem('fieldSettings:TableColumn', 'enableFormatter', {
      Component: SchemaSettingsEnableFormatter,
    });
    this.schemaSettingsManager.addItem('fieldSettings:TableColumn', 'customFormatter', {
      Component: SchemaSettingsCustomFormatter,
    });
  }
}

export default PluginFieldContentFormatterClient;
