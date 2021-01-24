import React from 'react';
import { Card, Descriptions, Button } from 'antd';
import { Actions } from '@/components/actions';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import Field from './Field';
import get from 'lodash/get';
import { useSize } from 'ahooks';
import { configResponsive, useResponsive } from 'ahooks';
configResponsive({
  small: 0,
  middle: 800,
  large: 1200,
});
export function Details(props: any) {
  const dom = document.querySelector('body');
  const responsive = useResponsive();
  console.log('Details.props', props)

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
  let descriptionsProps: any = {
    size: 'middle',
    bordered: true,
  }
  if (responsive.small && !responsive.middle && !responsive.large) {
    descriptionsProps = {
      layout: 'vertical'
    }
  }
  console.log(props);
  const { displayFields = [] } = activeTab;
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
        <Descriptions 
          // layout={'vertical'}
          // size={'middle'}
          // bordered 
          {...descriptionsProps}
          column={1}>
          {fields.map((field: any) => {
            if (Array.isArray(displayFields) && displayFields.length && displayFields.indexOf(field.id) === -1) {
              return null;
            }
            return (
              <Descriptions.Item label={field.title||field.name}>
                <Field data={field} viewType={'descriptions'} schema={field} value={get(data, field.name)}/>
              </Descriptions.Item>
            )
          })}
        </Descriptions>
      )}
    </Card>
  );
}
