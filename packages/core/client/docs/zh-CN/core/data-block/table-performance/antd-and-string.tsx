import { Button, Card, Table } from "antd";
import React from "react";

import tableCollection from './tableCollection.json';
import tableData from './tableData.json';

const Demo = () => {
  const [show, setShow] = React.useState<boolean>(false);
  const [dataSource, setDataSource] = React.useState<any>([]);
  const [columns, setColumns] = React.useState<any>([]);

  return <Card>
    {show && <Table scroll={{ x: 'max-content' }} rowKey={'id'} dataSource={dataSource} columns={columns} pagination={false} />}

    <Button block onClick={() => {
      setShow(true);
      setDataSource(tableData.data);
      const columns = tableCollection.fields.map((field: any) => ({
        title: field.name,
        dataIndex: field.name,
        key: field.key,
        render(v) {
          if (v && typeof v === 'object') {
            return JSON.stringify(v);
          }
          return v;
        }
      }));

      const indexColumn = { title: 'index', key: 'index', render(_1, _2, index) { return index + 1 } }
      setColumns([indexColumn, ...columns]);
    }}>渲染 Table</Button>
  </Card>
}

export default Demo;
