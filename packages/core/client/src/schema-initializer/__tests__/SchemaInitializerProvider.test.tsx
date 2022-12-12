import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { connect } from '@formily/react';

import { SchemaComponentProvider } from '../../schema-component/core/SchemaComponentProvider';
import { SchemaComponent } from '../../schema-component/core/SchemaComponent';
import { SchemaInitializerProvider, SchemaInitializerContext } from '../SchemaInitializerProvider';

function App() {
  const ComponentA = () => {
    // const initializes = useContext(SchemaInitializerContext);
    // console.log(initializes);
    return <div>66</div>;
  };
  const schema = {
    type: 'object',
    properties: {
      componentA: {
        type: 'void',
        'x-component': 'ComponentA',
      },
    },
  };
  return (
    <SchemaInitializerProvider initializers={{}}>
      <ComponentA />
    </SchemaInitializerProvider>
  );
}
describe('SchemaInitializerProvider', () => {
  it('SchemaInitializer', () => {
    const { container } = render(<App />);
    console.log(container);
    // expect(container).toMatchSnapshot();
  });
});
