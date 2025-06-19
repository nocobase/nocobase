/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { css } from '@emotion/css';
import { DatePicker } from '@formily/antd-v5';
import { getPickerFormat } from '@nocobase/utils/client';
import { DateFormatCom, ExpiresRadio } from '../../../../../components';
import { FormFieldModel } from '../FormFieldModel';

export class DateTimeFieldModel extends FormFieldModel {
  setComponentProps(componentProps) {
    let { dateFormat, timeFormat } = componentProps || {};
    if (!componentProps.format && (dateFormat || timeFormat)) {
      if (!dateFormat) {
        dateFormat = this.field.componentProps?.dateFormat || 'YYYY-MM-DD';
      }
      if (!timeFormat) {
        timeFormat = this.field.componentProps?.timeFormat || 'HH:mm:ss';
      }
      componentProps.format = componentProps?.showTime ? `${dateFormat} ${timeFormat}` : dateFormat;
    }
    super.setComponentProps({
      ...componentProps,
    });
  }

  get component() {
    return [DatePicker, {}];
  }
}

DateTimeFieldModel.registerFlow({
  key: 'key3',
  auto: true,
  sort: 1000,
  title: 'Specific properties',
  steps: {
    dateFormat: {
      title: 'Date display format',
      uiSchema: {
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
          // default: dateFormatDefaultValue,
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
              label: 'custom',
              value: 'custom',
            },
          ],
          'x-reactions': {
            dependencies: ['picker'],
            fulfill: {
              state: {
                value: `{{ getPickerFormat($deps[0])}}`,
                componentProps: { picker: `{{$deps[0]}}` },
              },
            },
          },
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
                  hidden: `{{ $form.values.picker !== 'date' || collectionField.type!== 'date' }}`,
                },
              },
            },
          ],
        },
        timeFormat: {
          type: 'string',
          title: '{{t("Time format")}}',
          'x-component': ExpiresRadio,
          'x-decorator': 'FormItem',
          'x-decorator-props': {
            className: css`
              margin-bottom: 0px;
            `,
          },
          'x-component-props': {
            className: css`
              color: red;
              .ant-radio-wrapper {
                display: flex;
                margin: 5px 0px;
              }
            `,
            defaultValue: 'h:mm a',
            formats: ['hh:mm:ss a', 'HH:mm:ss'],
            timeFormat: true,
          },
          'x-reactions': [
            (field) => {
              const { showTime } = field.form.values || {};
              field.hidden = !showTime;
            },
          ],
          enum: [
            {
              label: DateFormatCom({ format: 'hh:mm:ss a' }),
              value: 'hh:mm:ss a',
            },
            {
              label: DateFormatCom({ format: 'HH:mm:ss' }),
              value: 'HH:mm:ss',
            },
            {
              label: 'custom',
              value: 'custom',
            },
          ],
        },
      },

      handler(ctx, params) {
        ctx.model.flowEngine.flowSettings.registerScopes({
          getPickerFormat,
          collectionField: ctx.model.collectionField,
        });
        ctx.model.setComponentProps({ ...params });
      },
      defaultParams: (ctx) => {
        const { showTime, dateFormat, timeFormat, picker } = ctx.model.field.componentProps;
        return {
          picker: picker || 'date',
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat,
          showTime,
        };
      },
    },
  },
});
