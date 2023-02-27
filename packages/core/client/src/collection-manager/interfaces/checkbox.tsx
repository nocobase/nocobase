import React from 'react';
import { Trans } from 'react-i18next';
import { defaultProps, operators } from './properties';
import { IField } from './types';
import { CloseOutlined } from '@ant-design/icons';

export const checkbox: IField = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '{{t("Checkbox")}}',
  default: {
    type: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.showUnchecked': {
      type: 'boolean',
      title: (
        <Trans
          defaults="Display <icon></icon> when unchecked"
          components={{
            icon: <CloseOutlined style={{ color: '#ff4d4f' }} />
          }}
        />
      ),
      default: false,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    }
  },
  filterable: {
    operators: operators.boolean,
  },
};
