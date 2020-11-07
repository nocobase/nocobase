import React from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';
import { getPathName } from './utils';

export function CollectionIndex(props) {
  const { viewName, collection } = props.match.params;
  const { title, defaultViewName } = props.collection;

  return (
    <div>
      <PageHeader
        ghost={false}
        title={title}
        // subTitle="This is a subtitle"
        extra={[
          // <Button key="3">Operation</Button>,
          // <Button key="2">Operation</Button>,
          // <Button key="1" type="primary">
          //   Primary
          // </Button>,
        ]}
        // footer={
        //   <Tabs size={'small'} defaultActiveKey="1">
        //     <Tabs.TabPane tab="已发布" key="1" />
        //     <Tabs.TabPane tab="草稿" key="2" />
        //   </Tabs>
        // }
      />
      <div className={'collection-content'}>
        <ViewFactory {...props} 
          viewCollectionName={collection} 
          viewName={viewName||defaultViewName}
          resourceName={collection}
        />
      </div>
    </div>
  );
}

export default CollectionIndex;
