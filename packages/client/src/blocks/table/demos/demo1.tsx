import React from 'react';
import { TableBlock } from '@nocobase/client';

export default () => {
  return (
    <div>
      <TableBlock
        resource={'users'}
        initialValues={[
          { input: '文本1', input2: 'a' },
          { input: '文本2', input2: 'b' },
          { input: '文本3', input2: 'c' },
        ]}
        details={[
          {
            name: 'tab1',
            title: 'Tab1',
            blocks: [],
          },
          {
            name: 'tab2',
            title: 'Tab2',
            blocks: [],
          },
        ]}
        fields={[
          {
            interface: 'string',
            type: 'string',
            title: `单行文本`,
            name: 'input',
            required: true,
            default: 'abcdefg',
            'x-decorator': 'Column',
            'x-component': 'Input',
            'x-component-props': {
              placeholder: 'please enter',
            },
          },
          {
            interface: 'string',
            type: 'string',
            title: `单行文本2`,
            name: 'input2',
            required: true,
            default: 'abcdefg',
            'x-decorator': 'Column',
            'x-component': 'Input',
            'x-component-props': {
              placeholder: 'please enter',
            },
          },
        ]}
      />
    </div>
  );
};
