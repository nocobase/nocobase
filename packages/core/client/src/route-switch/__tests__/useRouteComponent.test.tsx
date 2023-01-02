import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { render } from '@testing-library/react';

import { useRouteComponent } from '../hooks';
import { RouteSwitchProvider } from '../RouteSwitchProvider';
import { RouteProps } from '../types';

describe('useRouteComponent test', () => {
  test('should get component from useRouteComponent', () => {
    const HelloWorld = () => {
      return <div className="test">Hello ui router</div>;
    };
    const routeData: RouteProps[] = [{ type: 'route', path: '/hello-world', component: 'HelloWorld' }];
    const wrapper: React.FC<any> = ({ children }) => {
      return (
        <RouteSwitchProvider routes={routeData} components={{ HelloWorld }}>
          {children}
        </RouteSwitchProvider>
      );
    };

    const { result } = renderHook(() => useRouteComponent('HelloWorld'), {
      wrapper,
    });
    const { container } = render(<result.current />);
    expect(container).toHaveTextContent('Hello ui router');
  });
});
