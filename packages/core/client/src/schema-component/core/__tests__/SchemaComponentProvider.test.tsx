import React from 'react';
import { render } from '@testing-library/react';
import { connect } from '@formily/react';

import { SchemaComponentProvider } from '../SchemaComponentProvider';
import { SchemaComponent } from '../SchemaComponent';

function App() {
  const ComponentA = connect((props) => {
    return <div>{props.title}</div>;
  });
  const schema = {
    type: 'object',
    properties: {
      componentA: {
        type: 'void',
        'x-component': 'ComponentA',
        'x-component-props': {
          title: 'hello',
        },
      },
    },
  };
  return (
    <SchemaComponentProvider components={{ ComponentA }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
describe('SchemaComponentProvider', () => {
  it('SchemaComponent get component by SchemaComponentProvider', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
