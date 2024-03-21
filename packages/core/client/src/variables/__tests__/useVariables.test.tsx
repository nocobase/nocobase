import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { act, renderHook, waitFor } from '@nocobase/test/client';
import React from 'react';
import { APIClientProvider } from '../../api-client';
import { mockAPIClient } from '../../testUtils';
import { CurrentUserProvider } from '../../user';
import VariablesProvider from '../VariablesProvider';
import useVariables from '../hooks/useVariables';

vi.mock('../../collection-manager', async () => {
  return {
    useCollectionManager_deprecated: () => {
      return {
        getCollectionJoinField: (path: string) => {
          if (path === 'users.belongsToField') {
            return {
              type: 'belongsTo',
              target: 'test',
            };
          }
          if (path === 'some.belongsToField') {
            return {
              type: 'belongsTo',
              target: 'someBelongsToField',
            };
          }
          if (path === 'some.belongsToField.belongsToField') {
            return {
              type: 'belongsTo',
              target: 'someBelongsToField',
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
          if (path === 'local.belongsToField') {
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

// 用于解析 `$nRole` 的值
apiClient.auth.role = 'root';

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
mockRequest.onGet('/roles:check').reply(() => {
  return [
    200,
    {
      data: {
        role: 'root',
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
mockRequest.onGet('/users/0/hasManyField:list?pageSize=9999').reply(() => {
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
mockRequest.onGet('/test/0/hasManyField:list?pageSize=9999').reply(() => {
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

mockRequest.onGet('/someBelongsToField/0/belongsToField:get').reply(() => {
  return [
    200,
    {
      data: {
        id: 0,
        name: '$some.belongsToField.belongsToField',
      },
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
      expect(result.current.ctxRef.current).toMatchInlineSnapshot(`
        {
          "$date": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nDate": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nRole": "root",
          "$system": {
            "now": [Function],
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
          "currentTime": [Function],
          "currentUser": {
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
      expect(result.current.ctxRef.current).toMatchInlineSnapshot(`
        {
          "$date": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nDate": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nRole": "root",
          "$system": {
            "now": [Function],
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
          "currentTime": [Function],
          "currentUser": {
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
      expect(result.current.ctxRef.current).toMatchInlineSnapshot(`
        {
          "$date": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nDate": {
            "last30Days": [Function],
            "last7Days": [Function],
            "last90Days": [Function],
            "lastIsoWeek": [Function],
            "lastMonth": [Function],
            "lastQuarter": [Function],
            "lastWeek": [Function],
            "lastYear": [Function],
            "next30Days": [Function],
            "next7Days": [Function],
            "next90Days": [Function],
            "nextIsoWeek": [Function],
            "nextMonth": [Function],
            "nextQuarter": [Function],
            "nextWeek": [Function],
            "nextYear": [Function],
            "now": [Function],
            "thisIsoWeek": [Function],
            "thisMonth": [Function],
            "thisQuarter": [Function],
            "thisWeek": [Function],
            "thisYear": [Function],
            "today": [Function],
            "tomorrow": [Function],
            "yesterday": [Function],
          },
          "$nRole": "root",
          "$new": {
            "name": "new variable",
          },
          "$system": {
            "now": [Function],
          },
          "$user": {
            "id": 0,
            "nickname": "from request",
          },
          "currentTime": [Function],
          "currentUser": {
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

  it('use object as local variable', async () => {
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

  it('use array as local variables', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(result.current.getVariable('$local')).toBe(null);
    });

    expect(
      await result.current.parseVariable('{{ $local.name }}', [
        {
          name: '$local',
          ctx: {
            name: 'local variable',
          },
        },
      ]),
    ).toBe('local variable');

    // 由于 $local 是一个局部变量，所以不会被缓存到 ctx 中
    expect(result.current.getVariable('$local')).toBe(null);
  });

  it('parse multiple variables concurrently using local variables', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    const promises = [];

    await waitFor(() => {
      for (let i = 0; i < 3; i++) {
        promises.push(
          result.current.parseVariable('{{ $user.nickname }}', [
            {
              name: `$local`,
              ctx: {
                name: `local variable ${i}`,
              },
            },
          ]),
        );
      }
    });

    await Promise.all(promises);

    // 并发多次解析之后，最终的全局变量不应该包含之前注册的局部变量
    expect(result.current.getVariable('$local')).toBe(null);
  });

  it('no id', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      result.current.registerVariable({
        name: '$some',
        ctx: {
          name: 'new variable',
          belongsToField: {
            id: 0,
          },
        },
        collectionName: 'some',
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $some.belongsToField.belongsToField }}')).toEqual({
        id: 0,
        name: '$some.belongsToField.belongsToField',
      });
    });

    // 会覆盖之前的 $some
    result.current.registerVariable({
      name: '$some',
      ctx: {
        name: 'new variable',
        belongsToField: null,
      },
      collectionName: 'some',
    });

    await waitFor(async () => {
      // 因为 $some 的 ctx 没有 id 所以无法获取关系字段的数据
      expect(await result.current.parseVariable('{{ $some.belongsToField.belongsToField }}')).toBe(undefined);
    });
  });

  it('getCollectionField', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.getCollectionField('{{ $user.belongsToField }}')).toEqual({
        type: 'belongsTo',
        target: 'test',
      });
    });
  });

  it('getCollectionField with no exist variable', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.getCollectionField('{{ $noExist.belongsToField }}')).toEqual(undefined);
    });
  });

  it('getCollectionField with local variables', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    const localVariables = [
      {
        name: '$local',
        ctx: {
          name: 'local variable',
        },
        collectionName: 'local',
      },
    ];

    await waitFor(async () => {
      expect(await result.current.getCollectionField('{{ $local.belongsToField }}', localVariables))
        .toMatchInlineSnapshot(`
        {
          "target": "test",
          "type": "belongsTo",
        }
      `);
    });
  });
});
