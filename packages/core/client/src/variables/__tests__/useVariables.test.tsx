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
          if (path === 'users.belongsToField') {
            return {
              type: 'belongsTo',
              target: 'test',
            };
          }
          if (path === 'users.hasManyField') {
            return {
              type: 'hasMany',
              target: 'test',
            };
          }
          if (path === 'users.hasManyField.hasManyField') {
            return {
              type: 'hasMany',
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
mockRequest.onGet('/users/0/belongsToField:get').reply(() => {
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
mockRequest.onGet('/users/0/hasManyField:list').reply(() => {
  return [
    200,
    {
      data: [
        {
          id: 0,
          name: 'name',
        },
      ],
    },
  ];
});
mockRequest.onGet('/test/0/hasManyField:list').reply(() => {
  return [
    200,
    {
      data: [
        {
          id: 0,
          name: 'name',
        },
      ],
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

  it('parsing variables with lazy loading of data', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToField }}')).toEqual({
        id: 0,
        name: 'name',
      });
    });
  });

  it('long variable path', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToField.name }}')).toBe('name');
    });
  });

  it('should return array when variable path is a hasMany field', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField }}')).toEqual([
        {
          id: 0,
          name: 'name',
        },
      ]);
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.name }}')).toEqual(['name']);
    });
  });

  it('$user.hasManyField.hasManyField', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.hasManyField }}')).toEqual([
        {
          id: 0,
          name: 'name',
        },
      ]);
    });
  });

  it('$user.hasManyField.hasManyField.name', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.hasManyField.name }}')).toEqual(['name']);
    });
  });

  it('should throw error when variable is not found', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      try {
        await result.current.parseVariable('{{ $some.name }}');
        // 如果走到这里则说明没有抛出错误，但是这里期望抛出错误，所以这里故意写一个错误的断言
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('VariablesProvider: $some is not found');
      }
    });
  });
});
