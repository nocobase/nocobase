/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useForm } from '@formily/react';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { TableColumnModel } from '../../TableColumnModel';
import { InputNumberReadPretty } from '../components/InputNumberReadPretty';

export class NumberColumnFieldModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['number', 'integer'];
  render() {
    return (value, record, index) => {
      return (
        <>
          <InputNumberReadPretty value={value} {...this.props.componentProps} />
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}
const UnitConversion = () => {
  const form = useForm();
  const { unitConversionType } = form.values;
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

NumberColumnFieldModel.registerFlow({
  key: 'format',
  sort: 100,
  title: 'Specific properties',
  auto: true,
  steps: {
    step1: {
      title: 'Format',
      uiSchema: {
        formatStyle: {
          type: 'string',
          enum: [
            {
              value: 'normal',
              label: 'Normal',
            },
            {
              value: 'scientifix',
              label: 'Scientifix notation',
            },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          title: "{{t('Style')}}",
        },
        unitConversion: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker',
          title: "{{t('Unit conversion')}}",
          'x-component-props': {
            style: { width: '100%' },
            addonBefore: <UnitConversion />,
          },
        },
        separator: {
          type: 'string',
          enum: [
            {
              value: '0,0.00',
              label: '100,000.00',
            },
            {
              value: '0.0,00',
              label: '100.000,00',
            },
            {
              value: '0 0,00',
              label: '100 000.00',
            },
            {
              value: '0.00',
              label: '100000.00',
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
          enum: [
            { value: '1', label: '1' },
            { value: '0.1', label: '1.0' },
            { value: '0.01', label: '1.00' },
            { value: '0.001', label: '1.000' },
            { value: '0.0001', label: '1.0000' },
            { value: '0.00001', label: '1.00000' },
            { value: '0.000001', label: '1.000000' },
            { value: '0.0000001', label: '1.0000000' },
            { value: '0.00000001', label: '1.00000000' },
          ],
        },
        addonBefore: {
          type: 'string',
          title: '{{t("Prefix")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
        addonAfter: {
          type: 'string',
          title: '{{t("Suffix")}}',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => {
        const { formatStyle, unitConversion, unitConversionType, separator, step, addonBefore, addonAfter } =
          ctx.model.getComponentProps();
        const { step: prescition } = ctx.model.field?.getComponentProps() || {};
        return {
          formatStyle: formatStyle || 'normal',
          unitConversion,
          unitConversionType,
          separator: separator || '0,0.00',
          step: step || prescition || '1',
          addonBefore,
          addonAfter,
        };
      },
      handler(ctx, params) {
        const { formatStyle, unitConversion, unitConversionType, separator, step, addonBefore, addonAfter } = params;
        const { step: prescition } = ctx.model.field?.getComponentProps() || {};
        ctx.model.setComponentProps({
          formatStyle: formatStyle || 'normal',
          unitConversion,
          unitConversionType,
          separator: separator || '0,0.00',
          step: step || prescition || '1',
          addonBefore,
          addonAfter,
        });
      },
    },
  },
});
