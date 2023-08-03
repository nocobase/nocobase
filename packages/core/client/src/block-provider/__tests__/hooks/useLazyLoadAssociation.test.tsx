import { createForm } from '@formily/core';
import { SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import React from 'react';
import { act, renderHook, sleep } from 'testUtils';
import { APIClientProvider } from '../../../api-client';
import { mockAPIClient } from '../../../test';
import { CurrentUserProvider } from '../../../user';
import { VariablesProvider } from '../../../variables';
import { useLazyLoadAssociation } from '../../hooks';

vi.mock('../../../collection-manager', async () => {
  return {
    useCollection: () => {
      return {
        name: 'form',
      };
    },
    useCollectionManager: () => {
      return {
        getCollectionJoinField: (path: string) => {
          if (path === 'form.a') {
            return {
              type: 'belongsTo',
              target: 'test',
            };
          }
          if (path === 'form.a.assoc') {
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
mockRequest.onGet('/test/1/assoc:get').reply(() => {
  return [
    200,
    {
      data: {
        id: 1,
        name: 'assoc_1',
      },
    },
  ];
});
mockRequest.onGet('/test/2/assoc:get').reply(() => {
  return [
    200,
    {
      data: {
        id: 2,
        name: 'assoc_2',
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

describe('useLazyLoadAssociation', () => {
  it('lazy load association fields', async () => {
    const form = createForm({
      initialValues: {
        a: { id: 1 }, // 这里的 a 是一个关系字段
        'a.id': 1, // 把 a 的 id 显示出来
        'a.assoc': null, // 把 assoc 字段显示出来
      },
    });

    expect(form.values).toMatchInlineSnapshot(`
      {
        "a": {
          "id": 1,
        },
        "a.assoc": null,
        "a.id": 1,
      }
    `);

    renderHook(() => useLazyLoadAssociation(form), {
      wrapper: Providers,
    });
    await sleep();

    expect(form.values).toMatchInlineSnapshot(`
      {
        "a": {
          "assoc": {
            "id": 1,
            "name": "assoc_1",
          },
          "id": 1,
        },
        "a.assoc": {
          "id": 1,
          "name": "assoc_1",
        },
        "a.id": 1,
      }
    `);

    act(() => {
      form.values.a = {
        id: 2,
      };
    });
    await sleep();

    expect(form.values).toMatchInlineSnapshot(`
      {
        "a": {
          "assoc": {
            "id": 2,
            "name": "assoc_2",
          },
          "id": 2,
        },
        "a.assoc": {
          "id": 2,
          "name": "assoc_2",
        },
        "a.id": 2,
      }
    `);
  });
});
