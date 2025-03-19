/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema, useField } from '@formily/react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent } from '../schema-component';
import { SchemaSettingsModalItem } from './SchemaSettings';
import {
  useCollectionManager_deprecated,
  useRecord,
  useDesignable,
  VariableInput,
  useFormBlockContext,
  FlagProvider,
  useFlag,
} from '..';
import { isVariable } from '../variables/utils/isVariable';

export const SchemaSettingsDateRange = function DateRangeConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field: any = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { isInSubForm, isInSubTable } = useFlag() || {};
  const collectionField = getCollectionJoinField(fieldSchema?.['x-collection-field']) || {};
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
  const isReadPretty = fieldSchema['x-read-pretty'] || field.readOnly || field.readPretty;
  const minDateDefaultValue = fieldSchema?.['x-component-props']?._minDate;
  const maxDateDefaultValue = fieldSchema?.['x-component-props']?._maxDate;
  const gmt = collectionField?.uiSchema?.['x-component-props'].gmt || false;
  const utc = collectionField?.uiSchema?.['x-component-props'].utc || false;
  const record = useRecord();
  const { form } = useFormBlockContext();

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
                minWidth: 385,
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
        <VariableInput
          {...props}
          form={form}
          record={record}
          noDisabled={true}
          renderSchemaComponent={renderSchemaComponent}
        />
      );
    },
    [fieldSchema, form, record, renderSchemaComponent],
  );

  // 无论是日期还是变量的情况下当值为空的时候都转换成undefined
  function getDateValue(dateObject) {
    if (dateObject === null || dateObject === undefined) {
      return undefined;
    }
    if (typeof dateObject === 'string') {
      return dateObject;
    }
    if (typeof dateObject === 'object' && Object.prototype.hasOwnProperty.call(dateObject, 'value')) {
      return getDateValue(dateObject.value);
    }
    return undefined;
  }

  return (
    <SchemaSettingsModalItem
      title={t('Date range limit')}
      schema={
        {
          type: 'object',
          'x-decorator': '',
          properties: {
            _minDate: {
              type: 'string',
              title: '{{t("MinDate")}}',
              'x-decorator': 'FormItem',
              'x-component': Component,
              'x-component-props': {
                name: '_minDate',
              },
              //日期和使用变量设置的默认值不同
              default: isVariable(minDateDefaultValue) ? minDateDefaultValue : { value: minDateDefaultValue },
            },
            _maxDate: {
              type: 'string',
              title: '{{t("MaxDate")}}',
              'x-decorator': 'FormItem',
              'x-component': Component,
              'x-component-props': {
                name: '_maxDate',
              },
              default: isVariable(maxDateDefaultValue) ? maxDateDefaultValue : { value: maxDateDefaultValue },
            },
          },
        } as ISchema
      }
      onSubmit={(data) => {
        const schema: any = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = field.componentProps || {};
        fieldSchema['x-component-props'] = {
          ...(field.componentProps || {}),
          _maxDate: getDateValue(data?._maxDate),
          _minDate: getDateValue(data?._minDate),
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];

        //子表格/表格区块
        const parts = (field.path.entire as string).split('.');
        parts.pop();
        const modifiedString = parts.join('.');
        field.query(`${modifiedString}.*[0:].${fieldSchema.name}`).forEach((f) => {
          if (f.props.name === fieldSchema.name) {
            f.setComponentProps({
              _maxDate: getDateValue(data?._maxDate),
              _minDate: getDateValue(data?._minDate),
            });
          }
        });

        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
      // 这里是为了在新增表单中设置日期范围时设置的值能正常显示
      ModalContextProvider={(props) => {
        return (
          <FlagProvider isInSubForm={isInSubForm} isInSubTable={isInSubTable} isInFormDataTemplate={true}>
            {props.children}
          </FlagProvider>
        );
      }}
    />
  );
};
