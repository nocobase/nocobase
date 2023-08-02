import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
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
        name: '$user.belongsToField',
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
          name: '$user.hasManyField',
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
          name: '$user.hasManyField.hasManyField',
        },
      ],
    },
  ];
});

const Providers = ({ children }) => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <SchemaOptionsContext.Provider value={{}}>
          <SchemaExpressionScopeContext.Provider value={{}}>
            <VariablesProvider>{children}</VariablesProvider>
          </SchemaExpressionScopeContext.Provider>
        </SchemaOptionsContext.Provider>
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
      expect(result.current.ctx).toMatchInlineSnapshot(`
        {
          "$date": {
            "now": [Function],
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
        }
      `);
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
        name: '$user.belongsToField',
      });
    });
  });

  it('long variable path', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToField.name }}')).toBe('$user.belongsToField');
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
          name: '$user.hasManyField',
        },
      ]);
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.name }}')).toEqual(['$user.hasManyField']);
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
          name: '$user.hasManyField.hasManyField',
        },
      ]);
    });
  });

  it('$user.hasManyField.hasManyField.name', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.hasManyField.name }}')).toEqual([
        '$user.hasManyField.hasManyField',
      ]);
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

  it('should not error when changing the variable path', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField }}')).toEqual([
        {
          id: 0,
          name: '$user.hasManyField',
        },
      ]);
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.hasManyField }}')).toEqual([
        {
          id: 0,
          name: '$user.hasManyField.hasManyField',
        },
      ]);
    });
  });

  it('register variable', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(result.current.ctx).toMatchInlineSnapshot(`
        {
          "$date": {
            "now": [Function],
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
        }
      `);
    });

    act(() => {
      result.current.registerVariable({
        name: '$new',
        collectionName: 'new',
        ctx: {
          name: 'new variable',
        },
      });
    });

    await waitFor(async () => {
      expect(result.current.ctx).toMatchInlineSnapshot(`
        {
          "$date": {
            "now": [Function],
          },
          "$new": {
            "name": "new variable",
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
        }
      `);
    });

    await waitFor(async () => {
      expect(result.current.getVariable('$new')).toEqual({
        name: '$new',
        collectionName: 'new',
        ctx: {
          name: 'new variable',
        },
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $new.name }}')).toBe('new variable');
    });
  });

  it('$new.noExist', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      result.current.registerVariable({
        name: '$new',
        ctx: {
          name: 'new variable',
        },
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $new.noExist }}')).toBe(undefined);
    });
  });

  it('use local variable', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(result.current.getVariable('$local')).toBe(null);
    });

    expect(
      await result.current.parseVariable('{{ $local.name }}', {
        name: '$local',
        ctx: {
          name: 'local variable',
        },
      }),
    ).toBe('local variable');

    // 由于 $local 是一个局部变量，所以不会被缓存到 ctx 中
    expect(result.current.getVariable('$local')).toBe(null);
  });
});
