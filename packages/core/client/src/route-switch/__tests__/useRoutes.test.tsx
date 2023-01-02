import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useRoutes } from '../hooks';
import { RouteSwitchProvider } from '../RouteSwitchProvider';
import { RouteProps } from '../types';

describe('useRoutes test', () => {
  test('should get routes from useRoutes', () => {
    const HelloWorld = () => {
      return <div>Hello ui router</div>;
    };
    const routeData: RouteProps[] = [{ type: 'route', path: '/hello-world', component: HelloWorld }];
    const wrapper: React.FC<any> = ({ children }) => {
      return (
        <RouteSwitchProvider routes={routeData} components={[]}>
          {children}
        </RouteSwitchProvider>
      );
    };

    const { result } = renderHook(() => useRoutes(), {
      wrapper,
    });
    expect(result.current).toBe(routeData);
  });
});
