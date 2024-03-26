import { css } from '@emotion/css';
import { ISchema, Schema, useField, useForm } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { useCollectionManager_deprecated, useDesignable } from '..';
import { SchemaSettingsModalItem } from './SchemaSettings';

const UnitConversion = ({ unitConversionType }) => {
  const form = useForm();
  const { t } = useTranslation();
  return (
    <Select
      defaultValue={unitConversionType || '*'}
      style={{ width: 160 }}
      onChange={(value) => {
        form.setValuesIn('unitConversionType', value);
      }}
    >
      <Select.Option value="*">{t('Multiply by')}</Select.Option>
      <Select.Option value="/">{t('Divide by')}</Select.Option>
    </Select>
  );
};

export const SchemaSettingsNumberFormat = function NumberFormatConfig(props: { fieldSchema: Schema }) {
  const { fieldSchema } = props;
  const field = useField();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-collection-field']) || {};
  const { formatStyle, unitConversion, unitConversionType, separator, step, addonBefore, addonAfter } =
    fieldSchema['x-component-props'] || {};
  const { step: prescition } = collectionField?.uiSchema['x-component-props'] || {};

  return (
    <SchemaSettingsModalItem
      title={t('Format')}
      schema={
        {
          type: 'object',
          properties: {
            formatStyle: {
              type: 'string',
              default: formatStyle || 'normal',
              enum: [
                {
                  value: 'normal',
                  label: t('Normal'),
                },
                {
                  value: 'scientifix',
                  label: t('Scientifix notation'),
                },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              title: "{{t('Style')}}",
            },
            unitConversion: {
              type: 'number',
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              title: "{{t('Unit conversion')}}",
              default: unitConversion,
              'x-component-props': {
                style: { width: '100%' },
                addonBefore: <UnitConversion unitConversionType={unitConversionType} />,
              },
            },
            separator: {
              type: 'string',
              default: separator || '0,0.00',
              enum: [
                {
                  value: '0,0.00',
                  label: t('100,000.00'),
                },
                {
                  value: '0.0,00',
                  label: t('100.000,00'),
                },
                {
                  value: '0 0,00',
                  label: t('100 000.00'),
                },
                {
                  value: '0.00',
                  label: t('100000.00'),
                },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              title: "{{t('Separator')}}",
            },
            step: {
              type: 'string',
              title: '{{t("Precision")}}',
              'x-component': 'Select',
              'x-decorator': 'FormItem',
              default: step || prescition || '1',
              enum: [
                { value: '1', label: '1' },
                { value: '0.1', label: '1.0' },
                { value: '0.01', label: '1.00' },
                { value: '0.001', label: '1.000' },
                { value: '0.0001', label: '1.0000' },
                { value: '0.00001', label: '1.00000' },
              ],
            },
            addonBefore: {
              type: 'string',
              title: '{{t("Prefix")}}',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
              default: addonBefore,
            },
            addonAfter: {
              type: 'string',
              title: '{{t("Suffix")}}',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
              default: addonAfter,
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
          ...data,
        };
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = fieldSchema['x-component-props'];
        //子表格/表格区块
        const parts = (field.path.entire as string).split('.');
        parts.pop();
        const modifiedString = parts.join('.');
        field.query(`${modifiedString}.*[0:].${fieldSchema.name}`).forEach((f) => {
          if (f.props.name === fieldSchema.name) {
            f.setComponentProps({ ...data });
          }
        });
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};
