import { ArrayField } from '@formily/core';
import { connect, ISchema, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Table, TableColumnType } from 'antd';
import React from 'react';

const ArrayTable = observer((props: any) => {
  const { rowKey } = props;
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const columnSchemas = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'ArrayTable.Column') {
      buf.push(s);
    }
    return buf;
  }, []);

  const columns = columnSchemas.map((s) => {
    return {
      render: (value, record) => {
        return <RecursionField name={record.__path} schema={s} onlyRenderProperties />;
      },
    } as TableColumnType<any>;
  });

  return <Table {...props} rowKey={rowKey} columns={columns} dataSource={field.value} />;
});

const Value = connect((props) => {
  return <li>value: {props.value}</li>;
});

const schema: ISchema = {
  type: 'object',
  properties: {
    objArr: {
      type: 'array',
      default: [
        { __path: '0', id: 1, value: 't1' },
        {
          __path: '1',
          id: 2,
          value: 't2',
          children: [
            {
              __path: '1.children.0',
              id: 5,
              value: 't5',
              parentId: 2,
            },
          ],
        },
        {
          __path: '2',
          id: 3,
          value: 't3',
          children: [
            {
              __path: '2.children.0',
              id: 4,
              value: 't4',
              parentId: 3,
              children: [
                {
                  __path: '2.children.0.children.0',
                  id: 6,
                  value: 't6',
                  parentId: 4,
                },
                {
                  __path: '2.children.0.children.1',
                  id: 7,
                  value: 't7',
                  parentId: 4,
                },
              ],
            },
          ],
        },
      ],
      'x-component': 'ArrayTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        c1: {
          type: 'void',
          'x-component': 'ArrayTable.Column',
          properties: {
            value: {
              type: 'string',
              'x-component': 'Value',
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ ArrayTable, Value }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
