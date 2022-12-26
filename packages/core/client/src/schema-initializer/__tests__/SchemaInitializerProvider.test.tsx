import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { connect } from '@formily/react';

import { SchemaComponentProvider } from '../../schema-component/core/SchemaComponentProvider';
import { SchemaComponent } from '../../schema-component/core/SchemaComponent';
import { SchemaInitializerProvider, SchemaInitializerContext } from '../SchemaInitializerProvider';

function App() {
  const ComponentA = connect(() => {
    const initializes = useContext(SchemaInitializerContext);
    return (
      <div>
        {Object.keys(initializes).map((v, index) => {
          return v;
        })}
      </div>
    );
  });
  const schema = {
    type: 'object',
    properties: {
      componentA: {
        type: 'void',
        'x-decorator': 'SchemaInitializerProvider',
        'x-component': 'ComponentA',
      },
    },
  };
  return (
    <SchemaComponentProvider components={{ ComponentA, SchemaInitializerProvider }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
describe('SchemaInitializerProvider', () => {
  it('SchemaInitializer', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });
});
