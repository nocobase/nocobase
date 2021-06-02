/**
 * title: 基本使用
 */
import React from 'react';
import { FormBlock } from '@nocobase/client';

const fields = [
  {
    interface: 'string',
    type: 'string',
    title: `单行文本`,
    name: 'username',
    required: true,
    default: 'abcdefg',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: 'please enter',
    },
  },
];

export default () => {
  return (
    <FormBlock
      resource={'users'}
      fields={fields}
      effects={{
        onFormValuesChange(form) {
          console.log('aaaa', form.values);
        },
      }}
    />
  );
};
