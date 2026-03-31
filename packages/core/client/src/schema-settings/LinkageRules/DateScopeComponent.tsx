/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { useFieldSchema } from '@formily/react';
import { SchemaComponent } from '../../schema-component';
import { useCollectionManager_deprecated, VariableInput, useFormBlockContext, useRecord } from '../../';
import { FlagProvider } from '../../flag-provider';

export const DateScopeComponent = (props) => {
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-collection-field']) || {};
  const gmt = collectionField?.uiSchema?.['x-component-props'].gmt || false;
  const utc = collectionField?.uiSchema?.['x-component-props'].utc || false;
  const { form } = useFormBlockContext();
  const record = useRecord();
  const showTime =
    fieldSchema?.['x-component-props']?.showTime || collectionField?.uiSchema?.['x-component-props']?.showTime || false;
  const dateFormat =
    fieldSchema?.['x-component-props']?.dateFormat ||
    collectionField?.uiSchema?.['x-component-props']?.dateFormat ||
    'YYYY-MM-DD';
  const timeFormat =
    fieldSchema?.['x-component-props']?.timeFormat ||
    collectionField?.uiSchema?.['x-component-props']?.timeFormat ||
    'HH:mm:ss';
  const picker =
    fieldSchema?.['x-component-props']?.picker || collectionField?.uiSchema?.['x-component-props']?.picker || 'date';

  const renderSchemaComponent = useCallback(
    (props) => {
      return (
        <SchemaComponent
          schema={{
            'x-component': 'DatePicker',
            'x-component-props': {
              dateFormat,
              timeFormat,
              gmt,
              utc,
              picker,
              showTime,
              placeholder: '{{t("Please select time or variable")}}',
              style: {
                minWidth: 250,
              },
            },
            name: 'value',
            'x-read-pretty': false,
            'x-validator': undefined,
            'x-decorator': undefined,
          }}
        />
      );
    },
    [dateFormat, gmt, picker, showTime, timeFormat, utc],
  );
  const Component = useCallback(
    (props) => {
      return (
        <FlagProvider collectionField={collectionField}>
          <VariableInput
            {...props}
            form={form}
            record={record}
            noDisabled={true}
            style={{ minWidth: '250px' }}
            renderSchemaComponent={renderSchemaComponent}
          />
        </FlagProvider>
      );
    },
    [fieldSchema, form, record, renderSchemaComponent],
  );

  return (
    <div>
      <SchemaComponent
        schema={{
          type: 'object',
          'x-component': 'FormLayout',
          'x-component-props': {
            layout: 'horizontal',
            labelStyle: {
              marginTop: '6px',
            },
            labelCol: 2,
            wrapperCol: 24,
          },
          properties: {
            _minDate: {
              type: 'string',
              title: '{{t("Min")}}',
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                labelCol: 4,
                wrapperCol: 20,
                labelAlign: 'left',
              },
              'x-component': Component,
              'x-component-props': {
                name: '_minDate',
              },
              //日期和使用变量设置的默认值不同
              // default: isVariable(minDateDefaultValue) ? minDateDefaultValue : { value: minDateDefaultValue },
            },
            _maxDate: {
              type: 'string',
              title: '{{t("Max")}}',
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                labelCol: 4,
                wrapperCol: 20,
                labelAlign: 'left',
              },
              'x-component': Component,
              'x-component-props': {
                name: '_maxDate',
              },
              // default: isVariable(maxDateDefaultValue) ? maxDateDefaultValue : { value: maxDateDefaultValue },
            },
          },
        }}
      />
    </div>
  );
};
