import { Button, Card, Table } from "antd";
import React, { FC, useContext } from "react";

import tableCollection from './tableCollection.json';
import tableData from './tableData.json';
import { AntdSchemaComponentPlugin, Application, Plugin, useCompile } from "@nocobase/client";
import { SchemaComponentsContext } from "@formily/react";
import { get } from 'lodash';
import MapPlugin from "@nocobase/plugin-map/client";
import FormulaFieldPlugin from "@nocobase/plugin-formula-field/client";
import ChinaRegionPlugin from "@nocobase/plugin-china-region/client";

const AssociationField: FC<{ value: any }> = ({ value }) => {
  if (value === undefined || value === null) return null;

  const text = JSON.stringify(value)
  return <span>{text.slice(0, 20)}{text.length > 20 && '...'}</span>
}

const Demo = () => {
  const [show, setShow] = React.useState<boolean>(false);
  const [dataSource, setDataSource] = React.useState<any>([]);
  const [columns, setColumns] = React.useState<any>([]);
  const components = useContext(SchemaComponentsContext);
  const compile = useCompile();
  return <Card>
    {show && <Table scroll={{ x: 'max-content' }} rowKey={'id'} dataSource={dataSource} columns={columns} pagination={false} />}

    <Button block onClick={() => {
      setShow(true);
      setDataSource(tableData.data);
      const columns = tableCollection.fields.map((field: any) => {
        const Component: any = get(components, field.uiSchema?.['x-component'] || 'Input');
        const componentProps = compile(field.uiSchema?.['x-component-props']);
        const ReadPretty = Component.ReadPretty ?? Component;

        return ({
          title: field.name,
          dataIndex: field.name,
          key: field.key,
          render(v) {
            return <ReadPretty {...componentProps} value={v} />;
          }
        })
      });

      const indexColumn = { title: 'index', key: 'index', render(_1, _2, index) { return index + 1 } }
      setColumns([indexColumn, ...columns]);
    }}>渲染 Table</Button>
  </Card>
}


class MyPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      AssociationField,
    })
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [AntdSchemaComponentPlugin, MapPlugin, FormulaFieldPlugin, ChinaRegionPlugin, MyPlugin],
})

app.router.add('home', {
  path: '/',
  Component: Demo,
});

export default app.getRootComponent();
