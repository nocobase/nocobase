import React from 'react';
import { Card, Descriptions, Button, Tooltip } from 'antd';
import { Actions } from '@/components/actions';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import Field from './Field';
import get from 'lodash/get';
import { useSize } from 'ahooks';
import { configResponsive, useResponsive } from 'ahooks';
import { InfoCircleOutlined } from '@ant-design/icons';

configResponsive({
  small: 0,
  middle: 800,
  large: 1200,
});
function toGroups(fields: any[], { displayFields = [] }) {
  const groups = [];
  let group = {
    title: undefined,
    tooltip: undefined,
    children: [],
  };
  fields.forEach(field => {
    if (Array.isArray(displayFields) && displayFields.length && displayFields.indexOf(field.id) === -1) {
      return null;
    }
    if (field.interface === 'description') {
      if (group.children.length) {
        groups.push(group);
      }
      group = {
        title: field.title,
        tooltip: get(field, 'component.tooltip'),
        children: [],
      };
    } else {
      group.children.push(field);
    }
  });
  if (group.children.length) {
    groups.push(group);
  }
  return groups;
}
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
  const { displayFields = [] } = activeTab;
  const groups = toGroups(fields, { displayFields });
  console.log({groups});
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
      {loading ? <Spin/> : groups.map(group => (
        <Descriptions 
          // layout={'vertical'}
          // size={'middle'}
          // bordered 
          {...descriptionsProps}
          title={group.title && <span>{group.title} {group.tooltip && <Tooltip title={group.tooltip}><InfoCircleOutlined /></Tooltip>}</span>}
          column={1}>
          {group.children.map((field: any) => {
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
      ))}
    </Card>
  );
}
