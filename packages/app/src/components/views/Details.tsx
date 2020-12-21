import React from 'react';
import { Card, Descriptions, Button } from 'antd';
import { Actions } from '@/components/actions';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import Field from './Field';
import get from 'lodash/get';

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
  const { actions = [], actionDefaultParams = {}, fields = [] } = props.schema;
  const { data = {}, loading, refresh } = useRequest(() => {
    const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
    return api.resource(name).get({
      resourceKey,
      associatedKey,
      ...actionDefaultParams,
    });
  });
  console.log(props);
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
              <Descriptions.Item labelStyle={{minWidth: 200, maxWidth: 300, width: 300}} label={field.title||field.name}>
                <Field viewType={'descriptions'} schema={field} value={get(data, field.name)}/>
              </Descriptions.Item>
            )
          })}
        </Descriptions>
      )}
    </Card>
  );
}
