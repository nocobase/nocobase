import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { RouteContext } from '../context';
import { useRoute } from '../hooks';

describe('useRoute tests', () => {
  test('should get route from useRoute', () => {
    const wrapper: React.FC = ({ children }) => (
      <RouteContext.Provider value={{ type: 'route' }}>{children}</RouteContext.Provider>
    );
    const { result } = renderHook(() => useRoute(), { wrapper });
    expect(result.current).toEqual({ type: 'route' });
  });
});
