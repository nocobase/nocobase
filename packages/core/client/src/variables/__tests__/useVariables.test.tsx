/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { act, renderHook, sleep, waitFor } from '@nocobase/test/client';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router';
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
          if (path === 'users.belongsToManyField') {
            return {
              type: 'belongsToMany',
              target: 'test',
              through: 'throughCollectionName',
            };
          }
          if (path === 'local.belongsToField') {
            return {
              type: 'belongsTo',
              target: 'test',
            };
          }
        },
        getCollection: () => {
          return {
            getPrimaryKey: () => 'id',
          };
        },
      };
    },
    CollectionManagerPane: null,
  };
});

const { apiClient, mockRequest } = mockAPIClient();

// 用于解析 `$nRole` 的值
apiClient.auth.role = 'root';
// 用于解析 `$nToken` 的值
apiClient.auth.token = 'token';

mockRequest.onPost('/auth:check').reply(() => {
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
mockRequest.onGet('/users/0/hasManyField:list?paginate=false').reply(() => {
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
mockRequest.onGet('/users/0/belongsToManyField:list?paginate=false').reply(() => {
  return [
    200,
    {
      data: [
        {
          id: 0,
          name: '$user.belongsToManyField',
          throughCollectionName: 'throughCollectionName',
        },
      ],
    },
  ];
});
mockRequest.onGet('/test/0/hasManyField:list?paginate=false').reply(() => {
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
  const history = createMemoryHistory();
  return (
    <Router location={history.location} navigator={history}>
      <APIClientProvider apiClient={apiClient}>
        <CurrentUserProvider>
          <SchemaOptionsContext.Provider value={{}}>
            <SchemaExpressionScopeContext.Provider value={{}}>
              <VariablesProvider>{children}</VariablesProvider>
            </SchemaExpressionScopeContext.Provider>
          </SchemaOptionsContext.Provider>
        </CurrentUserProvider>
      </APIClientProvider>
    </Router>
  );
};

describe('useVariables', () => {
  it('parsing variables with custom ctx', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      await sleep(100);
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
          "$nExactDate": {
            "nowLocal": [Function],
            "nowUtc": [Function],
            "todayDate": [Function],
            "todayLocal": [Function],
            "todayUtc": [Function],
            "tomorrowDate": [Function],
            "tomorrowLocal": [Function],
            "tomorrowUtc": [Function],
            "yesterdayDate": [Function],
            "yesterdayLocal": [Function],
            "yesterdayUtc": [Function],
          },
          "$nRole": "root",
          "$nToken": "token",
          "$nURLSearchParams": {},
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
      expect(await result.current.parseVariable('{{ $user.nickname }}').then(({ value }) => value)).toBe('test');
    });
  });

  it('parsing variables with current user data', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.nickname }}').then(({ value }) => value)).toBe(
        'from request',
      );
    });
  });

  it('$date', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(
        await result.current
          .parseVariable('{{ $date.today }}', [], { fieldOperator: '$dateOn' })
          .then(({ value }) => typeof value),
      ).toBe('string');
      expect(
        Array.isArray(
          await result.current
            .parseVariable('{{ $date.today }}', [], { fieldOperator: '$dateOn' })
            .then(({ value }) => value),
        ),
      ).toBe(false);
      expect(
        await result.current
          .parseVariable('{{ $date.today }}', [], { fieldOperator: '$dateBetween' })
          .then(({ value }) => value),
      ).toHaveLength(2);
    });
  });

  it('parsing variables with lazy loading of data', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToField }}').then(({ value }) => value)).toEqual({
        id: 0,
        name: '$user.belongsToField',
      });
    });

    await waitFor(async () => {
      // After lazy loading the association field value, the original $user variable value should not contain the association field value
      expect(await result.current.parseVariable('{{ $user }}').then(({ value }) => value)).toEqual({
        id: 0,
        nickname: 'from request',
      });
    });
  });

  it('set doNotRequest to true to ensure the result is empty', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(
        await result.current
          .parseVariable('{{ $user.belongsToField }}', undefined, { doNotRequest: true })
          .then(({ value }) => value),
      ).toBe(null);
    });
  });

  it('long variable path', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToField.name }}').then(({ value }) => value)).toBe(
        '$user.belongsToField',
      );
    });
  });

  it('should return array when variable path is a hasMany field', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField }}').then(({ value }) => value)).toEqual([
        {
          id: 0,
          name: '$user.hasManyField',
        },
      ]);
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField.name }}').then(({ value }) => value)).toEqual([
        '$user.hasManyField',
      ]);
    });
  });

  it('$user.hasManyField.hasManyField', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(
        await result.current.parseVariable('{{ $user.hasManyField.hasManyField }}').then(({ value }) => value),
      ).toEqual([
        {
          id: 0,
          name: '$user.hasManyField.hasManyField',
        },
      ]);
    });
  });

  it('$user.hasManyField', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.hasManyField }}')).toEqual({
        collectionName: 'test',
        dataSource: 'main',
        value: [
          {
            id: 0,
            name: '$user.hasManyField',
          },
        ],
      });
    });
  });

  it('$user.hasManyField.hasManyField.name', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(
        await result.current.parseVariable('{{ $user.hasManyField.hasManyField.name }}').then(({ value }) => value),
      ).toEqual(['$user.hasManyField.hasManyField']);
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
      expect(await result.current.parseVariable('{{ $user.hasManyField }}').then(({ value }) => value)).toEqual([
        {
          id: 0,
          name: '$user.hasManyField',
        },
      ]);
    });

    await waitFor(async () => {
      expect(
        await result.current.parseVariable('{{ $user.hasManyField.hasManyField }}').then(({ value }) => value),
      ).toEqual([
        {
          id: 0,
          name: '$user.hasManyField.hasManyField',
        },
      ]);
    });
  });

  it('should remove through collection field', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $user.belongsToManyField }}').then(({ value }) => value)).toEqual([
        {
          id: 0,
          name: '$user.belongsToManyField',
        },
      ]);
    });
  });

  it('register variable', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      await sleep(100);
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
          "$nExactDate": {
            "nowLocal": [Function],
            "nowUtc": [Function],
            "todayDate": [Function],
            "todayLocal": [Function],
            "todayUtc": [Function],
            "tomorrowDate": [Function],
            "tomorrowLocal": [Function],
            "tomorrowUtc": [Function],
            "yesterdayDate": [Function],
            "yesterdayLocal": [Function],
            "yesterdayUtc": [Function],
          },
          "$nRole": "root",
          "$nToken": "token",
          "$nURLSearchParams": {},
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
          "$nExactDate": {
            "nowLocal": [Function],
            "nowUtc": [Function],
            "todayDate": [Function],
            "todayLocal": [Function],
            "todayUtc": [Function],
            "tomorrowDate": [Function],
            "tomorrowLocal": [Function],
            "tomorrowUtc": [Function],
            "yesterdayDate": [Function],
            "yesterdayLocal": [Function],
            "yesterdayUtc": [Function],
          },
          "$nRole": "root",
          "$nToken": "token",
          "$nURLSearchParams": {},
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
        defaultValue: null,
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $new.name }}').then(({ value }) => value)).toBe('new variable');
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
      expect(await result.current.parseVariable('{{ $new.noExist }}').then(({ value }) => value)).toBe(null);
    });
  });

  it('$new.noExist with default value', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      result.current.registerVariable({
        name: '$new',
        ctx: {
          name: 'new variable',
        },
        defaultValue: 'default value',
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $new.noExist }}').then(({ value }) => value)).toBe('default value');
    });
  });

  it('$new.noExist with undefined default value', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      result.current.registerVariable({
        name: '$new',
        ctx: {
          name: 'new variable',
        },
        defaultValue: undefined,
      });
    });

    await waitFor(async () => {
      expect(await result.current.parseVariable('{{ $new.noExist }}').then(({ value }) => value)).toBe(undefined);
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
        collectionName: 'local',
        dataSource: 'local',
      }),
    ).toEqual({
      value: 'local variable',
      dataSource: 'local',
    });

    expect(
      await result.current.parseVariable('{{ $local }}', {
        name: '$local',
        ctx: {
          name: 'local variable',
        },
        collectionName: 'local',
        dataSource: 'local',
      }),
    ).toEqual({
      value: {
        name: 'local variable',
      },
      collectionName: 'local',
      dataSource: 'local',
    });

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
      await result.current
        .parseVariable('{{ $local.name }}', [
          {
            name: '$local',
            ctx: {
              name: 'local variable',
            },
          },
        ])
        .then(({ value }) => value),
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
      expect(
        await result.current.parseVariable('{{ $some.belongsToField.belongsToField }}').then(({ value }) => value),
      ).toEqual({
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
      defaultValue: 'default value',
    });

    await waitFor(async () => {
      // 只有解析后的值是 undefined 才会使用默认值
      expect(
        await result.current.parseVariable('{{ $some.belongsToField.belongsToField }}').then(({ value }) => value),
      ).toBe(null);
    });

    // 会覆盖之前的 $some
    result.current.registerVariable({
      name: '$some',
      ctx: {
        name: 'new variable',
      },
      collectionName: 'some',
      defaultValue: 'default value',
    });

    await waitFor(async () => {
      // 解析后的值是 undefined 所以会返回上面设置的默认值
      expect(
        await result.current.parseVariable('{{ $some.belongsToField.belongsToField }}').then(({ value }) => value),
      ).toBe('default value');
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

  it('getCollectionFiled with only variable name', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(await result.current.getCollectionField('{{ $user }}')).toEqual({
        target: 'users',
      });
    });
  });

  it('getCollectionFiled with local variable name', async () => {
    const { result } = renderHook(() => useVariables(), {
      wrapper: Providers,
    });

    await waitFor(async () => {
      expect(
        await result.current.getCollectionField('{{ $local }}', {
          name: '$local',
          ctx: {},
          collectionName: 'local',
        }),
      ).toEqual({
        target: 'local',
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
