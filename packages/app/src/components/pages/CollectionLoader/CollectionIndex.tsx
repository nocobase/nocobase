import React from 'react';
import * as View from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';

export function CollectionIndex(props) {
  return (
    <div>
      <PageHeader
        ghost={false}
        title="数据表配置"
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
        <View.Table/>
      </div>
    </div>
  );
}

export default CollectionIndex;
