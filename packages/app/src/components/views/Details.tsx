import React from 'react';
import { Card, Descriptions, Button } from 'antd';
import { Actions } from '@/components/actions';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';

export function Details(props: any) {
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    resourceKey,
  } = props;
  const { data = {}, loading, refresh } = useRequest(() => {
    const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
    return api.resource(name).get({
      resourceKey,
      associatedKey,
    });
  });
  console.log(props);
  const { actions = [], fields = [] } = props.schema;
  return (
    <Card bordered={false}>
      <Actions
        {...props}
        onFinish={() => {
          refresh();
        }}
        style={{ marginBottom: 14 }}
        actions={actions}
      />
      {loading ? <Spin/> : (
        <Descriptions bordered column={1}>
          {fields.map((field: any) => {
            return (
              <Descriptions.Item label={field.title||field.name}>{JSON.stringify(data[field.name])}</Descriptions.Item>
            )
          })}
        </Descriptions>
      )}
    </Card>
  );
}
