import React from 'react';
import * as View from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';

export function CollectionSingle(props) {
  return (
    <div>
      <PageHeader
        ghost={false}
        title="企业信息库"
        // subTitle="This is a subtitle"
        extra={[
          // <Button key="3">Operation</Button>,
          // <Button key="2">Operation</Button>,
          // <Button key="1" type="primary">
          //   Primary
          // </Button>,
        ]}
        footer={
          <Tabs size={'small'} defaultActiveKey="1">
            <Tabs.TabPane tab="详情" key="1" />
            <Tabs.TabPane tab="相关数据" key="2" />
          </Tabs>
        }
      />
      <div className={'collection-content'}>
        <View.Details/>
      </div>
    </div>
  );
}

export default CollectionSingle;
