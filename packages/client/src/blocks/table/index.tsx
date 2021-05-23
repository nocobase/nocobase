import React from 'react';
import { Table, Tabs, Card, Button } from 'antd';
import { Drawer } from '../../components/Drawer';
import { Resource, ResourceOptions } from '../../resource';
import { useRequest } from 'ahooks';
import { Field } from '../../';

export function fields2columns(fields: any[]) {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.map((field) => {
    field.dataIndex = field.name.split('.');
    field.render = (value, data, index) => {
      return (
        <Field
          schema={{
            'x-decorator': 'Column',
            'x-read-pretty': true,
            ...field,
          }}
          data={{
            ...data,
            __index__: index,
          }}
        />
      );
    };
    return field;
  });
}

export interface DetailOptions {
  name: string;
  title: string;
  blocks?: any;
}

export interface TableBlockProps {
  fields?: any;
  details?: Array<DetailOptions>;
  initialValues?: any;
  resource: string | Resource | ResourceOptions;
  [key: string]: any;
}

export function TableBlock(props: TableBlockProps) {
  const { fields = [], details = [], initialValues } = props;
  const columns = fields2columns(fields);
  const resource = Resource.make(props.resource);
  const { data, loading } = useRequest(() => {
    if (initialValues) {
      return Promise.resolve({
        list: initialValues,
      });
    }
    return resource.list();
  });
  console.log({ columns, data });
  return (
    <Table
      loading={loading}
      dataSource={data?.list}
      columns={columns}
      onRow={(data, index) => {
        return {
          onClick(e) {
            Drawer.open({
              bodyStyle: {
                padding: 0,
              },
              content: ({ resolve }) => {
                const tabList = details.map((detail) => {
                  return {
                    key: detail.name,
                    tab: detail.title,
                  };
                });
                return (
                  <div>
                    <Card
                      bordered={false}
                      title={'详情页面'}
                      tabList={tabList}
                      tabProps={{ size: 'small' }}
                    >
                      aaa
                    </Card>
                  </div>
                );
              },
            });
          },
        };
      }}
    />
  );
}

export default TableBlock;
