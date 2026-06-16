/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { defineAction, tExpr } from '@nocobase/flow-engine';
import { getPickerFormat } from '@nocobase/utils/client';
import { DateFormatCom, ExpiresRadio } from '../components';
import {
  getDateTimeFormatCollectionField,
  isDateOnlyCollectionField,
  isTimeCollectionField,
  resolveDateTimeDisplayProps,
} from '../utils/dateTimeDisplayProps';

const isTableColumnFieldSubModel = (model) => {
  const parent = model?.parent;
  return (
    parent?.subModels?.field === model &&
    (parent?.use === 'TableColumnModel' || parent?.constructor?.name === 'TableColumnModel')
  );
};

const syncTableColumnDateTimeFormatProps = (ctx, props) => {
  const model = ctx.model;
  if (!isTableColumnFieldSubModel(model) || !model?.parent?.collectionField?.isAssociationField?.()) {
    return;
  }

  model.parent.setProps(props);
};

export const dateTimeFormat = defineAction({
  title: tExpr('Date display format'),
  name: 'dateDisplayFormat',
  uiSchema: (ctx) => {
    const collectionField = getDateTimeFormatCollectionField({ model: ctx.model });
    const isTimeField = isTimeCollectionField(collectionField);
    const timeFormatField = {
      type: 'string',
      title: '{{t("Time format")}}',
      'x-component': ExpiresRadio,
      'x-decorator': 'FormItem',
      'x-component-props': {
        className: css`
          .ant-radio-wrapper {
            display: flex;
            margin: 5px 0px;
          }
        `,
        defaultValue: 'h:mm a',
        formats: ['hh:mm:ss a', 'HH:mm:ss'],
        timeFormat: true,
      },
      enum: [
        { label: DateFormatCom({ format: 'hh:mm:ss a' }), value: 'hh:mm:ss a' },
        { label: DateFormatCom({ format: 'HH:mm:ss' }), value: 'HH:mm:ss' },
        { label: tExpr('Custom'), value: 'custom' },
      ],
      'x-reactions': [
        (field) => {
          if (!isTimeField) {
            const { showTime, picker } = field.form.values || {};
            field.hidden = isDateOnlyCollectionField(collectionField) || !showTime || picker !== 'date';
          }
        },
      ],
    };

    if (isTimeField) {
      return {
        timeFormat: timeFormatField,
      };
    }
    return {
      picker: {
        type: 'string',
        title: '{{t("Picker")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        description: '{{ t("Switching the picker, the value and default value will be cleared") }}',
        enum: [
          {
            label: '{{t("Date")}}',
            value: 'date',
          },

          {
            label: '{{t("Month")}}',
            value: 'month',
          },
          {
            label: '{{t("Quarter")}}',
            value: 'quarter',
          },
          {
            label: '{{t("Year")}}',
            value: 'year',
          },
        ],
      },
      dateFormat: {
        type: 'string',
        title: '{{t("Date format")}}',
        'x-component': ExpiresRadio,
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component-props': {
          className: css`
            .ant-radio-wrapper {
              display: flex;
              margin: 5px 0px;
            }
          `,
          defaultValue: 'dddd',
          formats: ['MMMM Do YYYY', 'YYYY-MM-DD', 'MM/DD/YY', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        },
        enum: [
          {
            label: DateFormatCom({ format: 'MMMM Do YYYY' }),
            value: 'MMMM Do YYYY',
          },
          {
            label: DateFormatCom({ format: 'YYYY-MM-DD' }),
            value: 'YYYY-MM-DD',
          },
          {
            label: DateFormatCom({ format: 'MM/DD/YY' }),
            value: 'MM/DD/YY',
          },
          {
            label: DateFormatCom({ format: 'YYYY/MM/DD' }),
            value: 'YYYY/MM/DD',
          },
          {
            label: DateFormatCom({ format: 'DD/MM/YYYY' }),
            value: 'DD/MM/YYYY',
          },
          {
            label: tExpr('Custom'),
            value: 'custom',
          },
        ],
        'x-reactions': [
          (field) => {
            const { picker } = field.form.values;
            field.value = getPickerFormat(picker);
            field.setComponentProps({ picker });
          },
        ],
      },
      showTime: {
        type: 'boolean',
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
        'x-content': '{{t("Show time")}}',
        'x-reactions': [
          {
            dependencies: ['picker'],
            fulfill: {
              state: {
                hidden: `{{ $form.values.picker !== 'date'  }}`,
              },
            },
          },
          (field) => {
            const collectionField = getDateTimeFormatCollectionField({ model: ctx.model });
            const { picker } = field.form.values || {};
            const isDateOnlyField = isDateOnlyCollectionField(collectionField);
            field.hidden = isDateOnlyField || picker !== 'date';
            if (isDateOnlyField || picker !== 'date') {
              field.value = false;
            }
          },
        ],
      },
      timeFormat: timeFormatField,
    };
  },
  defaultParams: (ctx: any) => {
    const { showTime, dateFormat, timeFormat, picker } = resolveDateTimeDisplayProps({
      model: ctx.model,
      withDefaults: true,
    });
    return {
      picker: picker || 'date',
      dateFormat: dateFormat || 'YYYY-MM-DD',
      timeFormat: timeFormat || 'HH:mm:ss',
      showTime,
    };
  },
  async beforeParamsSave(ctx: any, params) {
    const props = resolveDateTimeDisplayProps({ model: ctx.model, params });
    ctx.model.setProps(props);
    syncTableColumnDateTimeFormatProps(ctx, props);
    await ctx.model.save?.();
  },
  handler(ctx: any, params) {
    ctx.model.setProps(resolveDateTimeDisplayProps({ model: ctx.model, params }));
  },
});
