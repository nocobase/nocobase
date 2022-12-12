import React, { useContext } from 'react';
import { render } from '@testing-library/react';
import { PMProvider } from '../index';
import { RouteSwitchContext } from '../../route-switch';


const ComponentA = () => {
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  console.log(routes, components, others);
  return <div>'test'</div>;
};

describe('PMProvider', () => {
  it('RouteSwitchContext is ok', () => {
    const { container } = render(
      <PMProvider>
        <ComponentA />
      </PMProvider>,
    );

    // expect(container).toMatchSnapshot();
  });
});
