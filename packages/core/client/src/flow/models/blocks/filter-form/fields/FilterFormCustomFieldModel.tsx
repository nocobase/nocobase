/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FilterFormCustomItemModel } from '../FilterFormCustomItemModel';
import { escapeT } from '@nocobase/flow-engine';
import { FieldComponentProps } from './FieldComponentProps';

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  render() {
    return <div>123</div>;
  }
}

FilterFormCustomFieldModel.define({
  label: '{{t("Custom field")}}',
  sort: 1,
});

FilterFormCustomFieldModel.registerFlow({
  key: 'formItemSettings',
  title: escapeT('Form item settings'),
  steps: {
    fieldSettings: {
      preset: true,
      title: escapeT('Field Settings'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Field title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        source: {
          type: 'string',
          title: escapeT('Field source'),
          'x-decorator': 'FormItem',
          'x-component': 'Cascader',
          'x-component-props': {
            placeholder: escapeT('Select a source field to use metadata of the field'),
          },
          description: escapeT('Select a source field to use metadata of the field'),
        },
        fieldModel: {
          type: 'string',
          title: escapeT('Field model'),
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: escapeT('Input'), value: 'InputFieldModel' },
            { label: escapeT('Number'), value: 'NumberFieldModel' },
            { label: escapeT('Date'), value: 'DateTimeFilterFieldModel' },
            { label: escapeT('Select'), value: 'SelectFieldModel' },
            { label: escapeT('Radio group'), value: 'RadioGroupFieldModel' },
            { label: escapeT('Checkbox group'), value: 'CheckboxGroupFieldModel' },
            { label: escapeT('Record select'), value: 'RecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: escapeT('Please select'),
          },
        },
        props: {
          type: 'object',
          title: escapeT('Component properties'),
          'x-component': FieldComponentProps,
          'x-reactions': [
            {
              dependencies: ['fieldModel'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                  },
                },
              },
            },
          ],
        },
      },
      handler(ctx, params) {},
    },
  },
});
