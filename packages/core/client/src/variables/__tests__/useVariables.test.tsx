import React from 'react';
import { act, renderHook, waitFor } from 'testUtils';
import { APIClientProvider } from '../../api-client';
import { mockAPIClient } from '../../test';
import { CurrentUserProvider } from '../../user';
import VariablesProvider from '../VariablesProvider';
import useVariables from '../hooks/useVariables';

vi.mock('../../collection-manager', async () => {
  return {
    useCollectionManager: () => {
      return {
        getCollectionJoinField: (path: string) => {
          if (path === 'users.associationField') {
            return {
              type: 'belongsTo',
              target: 'test',
            };
          }
        },
      };
    },
    CollectionManagerPane: null,
  };
});

const { apiClient, mockRequest } = mockAPIClient();
mockRequest.onGet('/auth:check').reply(() => {
  return [
    200,
    {
      data: {
        id: 0,
        nickname: 'from request',
      },
    },
  ];
});
mockRequest.onGet('/users/0/associationField:get').reply(() => {
  return [
    200,
    {
      data: {
        id: 0,
        name: 'name',
      },
    },
  ];
});

const Providers = ({ children }) => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <VariablesProvider>{children}</VariablesProvider>
      </CurrentUserProvider>
    </APIClientProvider>
  );
};

describe('useVariables', () => {
  it('parsing variables with custom ctx', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(result.current.ctx).toEqual({
        $user: {
          id: 0,
          nickname: 'from request',
        },
      });
    });

    act(() => {
      result.current.setCtx({
        $user: {
          nickname: 'test',
        },
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.nickname }}')).toBe('test');
    });
  });

  it('parsing variables with current user data', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.nickname }}')).toBe('from request');
    });
  });

  it('should still be parsed correctly even if there is missing data locally that actually exists', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.associationField }}')).toEqual({
        id: 0,
        name: 'name',
      });
    });
  });
});
