import { vi } from 'vitest';
import {
  useChartFields,
  useFieldTransformer,
  useFieldTypes,
  useFields,
  useFormatters,
  useQueryWithAlias,
  useTransformers,
} from '../hooks';
import { renderHook } from '@testing-library/react-hooks';
import * as client from '@nocobase/client';
import formatters from '../block/formatters';
import transformers from '../block/transformers';

describe('hooks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('useFields', () => {
    vi.spyOn(client, 'useCollectionManager').mockReturnValue({
      getCollectionFields: () => [
        {
          name: 'name',
          type: 'string',
          interface: 'string',
          uiSchema: {
            title: '{{t("Name")}}',
          },
        },
        {
          name: 'roles',
          type: 'hasMany',
          interface: 'o2m',
        },
      ],
    } as any);
    const fields = renderHook(() => useFields()).result.current;
    expect(fields.length).toBe(1);
    expect(fields[0].key).toBe('name');
    expect(fields[0].label).toBe('Name');
    expect(fields[0].value).toBe('name');
  });

  test('useChartFields', () => {
    const { result } = renderHook(() =>
      useChartFields([
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
        {
          key: 'email',
          label: 'Email',
          value: 'email',
        },
      ]),
    );
    const func = result.current;
    const field = {
      query: () => ({
        get: () => ({
          measures: [
            {
              field: 'email',
              alias: 'Email Alias',
            },
          ],
        }),
      }),
      dataSource: [],
    };
    func(field);
    expect(field.dataSource).toEqual([
      {
        key: 'name',
        label: 'Name',
        value: 'Name',
      },
      {
        key: 'email',
        label: 'Email',
        value: 'Email',
      },
      {
        key: 'Email Alias',
        label: 'Email Alias',
        value: 'Email Alias',
      },
    ]);
  });

  test('useFormatters', () => {
    const { result } = renderHook(() =>
      useFormatters([
        {
          key: 'createdAt',
          label: 'Created At',
          value: 'Created At',
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
        },
      ]),
    );
    const func = result.current;
    const field = {
      query: () => ({
        get: () => 'createdAt',
      }),
      dataSource: [],
    };
    func(field);
    expect(field.dataSource).toEqual(formatters.datetime);
  });

  test('useFieldTypes', () => {
    const { result } = renderHook(() =>
      useFieldTypes([
        {
          key: 'price',
          label: 'Price',
          value: 'Price',
          name: 'price',
          type: 'double',
        },
        {
          key: 'id',
          label: 'ID',
          value: 'ID',
          name: 'id',
          type: 'id',
        },
      ]),
    );
    const func = result.current;
    let state1 = {};
    let state2 = {};
    const field = {
      dataSource: [],
      state: {},
    };
    const field1 = {
      query: () => ({
        get: () => 'Price',
      }),
      setState: (state) => (state1 = state),
      ...field,
    };
    const field2 = {
      query: () => ({
        get: () => 'ID',
      }),
      setState: (state) => (state2 = state),
      ...field,
    };
    func(field1);
    func(field2);
    expect(field1.dataSource.map((item) => item.value)).toEqual(Object.keys(transformers));
    expect(state1).toEqual({ value: 'number', disabled: true });
    expect(state2).toEqual({ value: null, disabled: false });
  });

  test('useTransformers', () => {
    const field = {
      query: () => ({
        get: () => 'datetime',
      }),
      dataSource: [],
    };
    renderHook(() => useTransformers(field));
    expect(field.dataSource.map((item) => item.value)).toEqual(Object.keys(transformers['datetime']));
  });

  test('useQueryWithAlias', () => {
    const { result } = renderHook(() =>
      useQueryWithAlias(
        [
          {
            key: 'name',
            name: 'name',
            label: 'Name',
            value: 'Name',
          },
          {
            key: 'email',
            name: 'email',
            label: 'Email',
            value: 'Email',
          },
        ],
        {
          measures: [
            {
              field: 'name',
            },
            {
              field: 'email',
              alias: 'Email Alias',
            },
          ],
        },
      ),
    );
    expect(result.current.measures).toEqual([
      {
        field: 'name',
        alias: 'Name',
      },
      {
        field: 'email',
        alias: 'Email Alias',
      },
    ]);
  });

  test('useFieldTransformers', () => {
    const { result } = renderHook(() =>
      useFieldTransformer([
        {
          field: '1',
          type: 'datetime',
          format: 'YYYY',
        },
        {
          field: '2',
          type: 'number',
          format: 'YYYY',
        },
      ]),
    );
    expect(result.current['1']).toBeDefined();
    expect(result.current['1'].formatter).toBeDefined();
    expect(result.current['2']).toBeUndefined();
  });
});
