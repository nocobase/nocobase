import { FormItem } from '@formily/antd';
import React from 'react';
import { Checkbox } from '../Checkbox';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';
import { render } from '@testing-library/react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'boolean',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};

const App = () => {
  return (
    <SchemaComponentProvider components={{ Checkbox, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

describe('checkbox', () => {
  it('checkbox', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
