import { FormItem } from '@formily/antd';
import { render } from '@testing-library/react';
import React from 'react';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';

import { ColorSelect } from '../ColorSelect';
const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'ColorSelect',
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
      'x-component': 'ColorSelect',
    },
  },
};

const App = () => {
  return (
    <SchemaComponentProvider components={{ ColorSelect, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

describe('ColorSelect', () => {
  it('ColorSelect', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
