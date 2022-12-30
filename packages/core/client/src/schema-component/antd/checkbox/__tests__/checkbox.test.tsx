import { FormItem } from '@formily/antd';
import React from 'react';
import { Checkbox } from '../Checkbox';
import { SchemaComponent, SchemaComponentProvider } from '../../../../schema-component';
import { render ,fireEvent,screen} from '@testing-library/react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `edit`,
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
  it('checkbox', async() => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
    const checkbox=container.getElementsByClassName('ant-checkbox-wrapper')[0]
    fireEvent.click(checkbox);
     expect(checkbox).toHaveClass('ant-checkbox-wrapper-checked');
  });
});
