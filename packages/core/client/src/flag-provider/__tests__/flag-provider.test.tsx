import React from 'react';
import { renderHook } from 'testUtils';
import { FlagProvider } from '../FlagProvider';
import { useFlag } from '../hooks/useFlag';

describe('FlagProvider', () => {
  it('should render', () => {
    const { result } = renderHook(() => useFlag(), {
      wrapper: ({ children }) => {
        return <FlagProvider isInAssignFieldValues={true}>{children}</FlagProvider>;
      },
    });

    expect(result.current.isInAssignFieldValues).toBe(true);
  });
});
