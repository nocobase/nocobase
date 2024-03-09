import React, { FC, useContext } from 'react'
import {
  FormItem,
  ArrayTable,
} from '@formily/antd-v5'
import { Field, SchemaComponentsContext, useFieldSchema } from '@formily/react'
import { Button, Card } from 'antd'

import tableCollection from './tableCollection.json';
import tableData from './tableData.json';
import { get, merge } from 'lodash'
import { AntdSchemaComponentPlugin, Application, Plugin, SchemaComponent, useCompile } from '@nocobase/client'
import MapPlugin from '@nocobase/plugin-map/client'
import FormulaFieldPlugin from '@nocobase/plugin-formula-field/client'
import ChinaRegionPlugin from '@nocobase/plugin-china-region/client'

const AssociationField: FC<{ value: any }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  const text = JSON.stringify(value)
  return <span>{text.slice(0, 20)}{text.length > 20 && '...'}</span>
}

const fieldsMap = tableCollection.fields.reduce((acc, field) => {
  acc[field.name] = field;
  return acc;
}, {});

const CollectionField: FC<{ value: any }> = ({ value }) => {
  const compile = useCompile();
  const components = useContext(SchemaComponentsContext);
  const fieldSchema: any = useFieldSchema();
  const collectionField = get(fieldsMap, fieldSchema.name);
  const Component: any = get(components, collectionField?.uiSchema?.['x-component'] || 'Input');
  const componentProps = compile(merge(fieldSchema['x-component-props'], collectionField.uiSchema?.['x-component-props']));
  return <Component {...componentProps} value={value} />
}

const Demo = () => {
  const [show, setShow] = React.useState<boolean>(false);
  const [schema, setSchema] = React.useState<any>(null);

  return <Card>
    {show && <SchemaComponent schema={schema} />}

    <Button block onClick={() => {
      setShow(true);
      const columns = tableCollection.fields.reduce((acc, field: any) => {
        acc[field.name] = {
          type: 'void',
          'x-component': 'ArrayTable.Column',
          'x-component-props': { width: 200, title: field.name },
          properties: {
            [field.name]: {
              type: 'string',
              // pattern: 'readPretty',
              'x-pattern': 'readPretty',
              'x-component': 'CollectionField',
            },
          },
        }
        return acc;
      }, {});

      setSchema({
        type: 'object',
        name: 'table',
        default: {
          array: tableData.data
        },
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

class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      AssociationField,
      ArrayTable,
      FormItem,
      CollectionField,
    })
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [AntdSchemaComponentPlugin, MapPlugin, ChinaRegionPlugin, FormulaFieldPlugin, MyPlugin],
})

app.router.add('home', {
  path: '/',
  Component: Demo,
});

export default app.getRootComponent();
