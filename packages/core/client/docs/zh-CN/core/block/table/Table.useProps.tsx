import React from 'react';
import { useBlockRequestV2, useBlockSettingsV2, useDesignable, useSchemaInitializerRender } from '@nocobase/client';
import { ISchema, RecursionField, Schema, useFieldSchema } from '@formily/react';
import { TableProps } from 'antd';

interface TableRequest {
  data: any[];
  meta: {
    count: number;
    page: number;
    pageSize: number;
    totalPage: number;
  };
}

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

export const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const useTableColumns = () => {
  const schema = useFieldSchema();
  const { designable } = useDesignable();
  const { exists, render } = useSchemaInitializerRender(schema['x-initializer'], schema['x-initializer-props']);
  const columns = schema
    .reduceProperties((buf, s) => {
      if (isColumnComponent(s)) {
        return buf.concat([s]);
      }
      return buf;
    }, [])
    ?.map((s: Schema) => {
      const collectionFields = s.reduceProperties((buf, s) => {
        if (isCollectionFieldComponent(s)) {
          return buf.concat([s]);
        }
      }, []);
      const dataIndex = collectionFields?.length > 0 ? collectionFields[0].name : s.name;
      return {
        title: <RecursionField name={s.name} schema={s} onlyRenderSelf />,
        dataIndex,
        key: s.name,
        sorter: s['x-component-props']?.['sorter'],
        width: 200,
        ...s['x-component-props'],
        render: (v, record) => {
          return v;
        },
      };
    });
  if (!exists) {
    return columns;
  }

  const tableColumns = columns.concat({
    title: render(),
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
    render: designable ? () => <div style={{ minWidth: 300 }} /> : null,
  });
  return tableColumns;
};

export function useTableProps(): TableProps<any> {
  const { data, loading } = useBlockRequestV2<TableRequest>();
  const { props, dn } = useBlockSettingsV2<{
    rowKey?: string;
    params?: Record<string, any>;
    bordered?: boolean;
  }>();
  const { rowKey, params, bordered } = props;
  const columns = useTableColumns();
  return {
    columns,
    loading,
    dataSource: data?.data || [],
    rowKey,
    bordered,
    pagination: {
      pageSize: params.pageSize || 5,
      current: params.page || 1,
      total: data?.meta?.count,
      onChange(page, pageSize) {
        dn.deepMerge({
          'x-decorator-props': {
            params: {
              pageSize,
              page,
            },
          },
        });
      },
    },
    components: {
      body: {
        row: ({ children, ...props }) => {
          return <tr {...props}>{children}</tr>;
        },
      },
    },
  };
}
