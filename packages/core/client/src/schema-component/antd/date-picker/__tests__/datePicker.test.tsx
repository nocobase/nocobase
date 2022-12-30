import { FormItem } from '@formily/antd';
import React from 'react';
import { render } from '@testing-library/react';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';
import { Input } from '../../input';
import { DatePicker } from '../DatePicker';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        dateFormat: 'YYYY/MM/DD',
        showTime: true,
      },
      // default: '2022-11-22',
    },
    read1: {
      type: 'boolean',
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        dateFormat: 'YYYY/MM/DD',
        showTime: true,
      },
    },
  },
};

const App = () => {
  return (
    <SchemaComponentProvider components={{ Input, DatePicker, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

describe('DatePicker', () => {
  it('DatePicker', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
