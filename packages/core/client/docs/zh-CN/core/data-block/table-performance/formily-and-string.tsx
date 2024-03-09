import React, { FC, useMemo } from 'react'
import {
  FormItem,
  ArrayTable,
} from '@formily/antd-v5'
import { createForm } from '@formily/core'
import { FormProvider, createSchemaField } from '@formily/react'
import { Button, Card } from 'antd'

import tableCollection from './tableCollection.json';
import tableData from './tableData.json';

const CollectionField = ({ value }) => {
  return <span>{value && typeof value === 'object' ? JSON.stringify(value) : value}</span>;
}

const SchemaField = createSchemaField({
  components: {
    ArrayTable,
    FormItem,
    CollectionField,
  },
})

const Demo = () => {
  const [show, setShow] = React.useState<boolean>(false);
  const [schema, setSchema] = React.useState<any>(null);
  const form = useMemo(() => createForm(), []);

  return <Card>
    {show && <FormProvider form={form}>
      <SchemaField schema={schema} />
    </FormProvider>}

    <Button block onClick={() => {
      setShow(true);
      form.setInitialValues({ array: tableData.data });
      const indexColumn = {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { width: 50, title: 'Index', align: 'center' },
        properties: {
          index: {
            type: 'void',
            'x-component': 'span',
          },
        },
      }
      const columns = tableCollection.fields.reduce((acc, field: any) => {
        acc[field.name] = {
          type: 'void',
          'x-component': 'ArrayTable.Column',
          'x-component-props': { width: 200, title: field.name },
          properties: {
            [field.name]: {
              type: 'string',
              'x-component': 'CollectionField',
            },
          },
        }
        return acc;
      }, { index: indexColumn });

      setSchema({
        type: 'object',
        name: 'table',
        properties: {
          array: {
            type: 'array',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayTable',
            'x-component-props': {
              rowKey: 'id',
              pagination: {
                pageSize: 100,
              },
              scroll: { x: 'max-content' },
            },
            items: {
              type: 'object',
              properties: columns,
            }
          },
        },
      })
    }}>渲染 Table</Button>
  </Card>
}

export default Demo;
