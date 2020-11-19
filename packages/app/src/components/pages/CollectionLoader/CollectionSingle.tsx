import React from 'react';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { CollectionTabPane } from './CollectionTabPane';
import { getPathName, redirectTo } from './utils';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';

export function CollectionSingle(props) {
  console.log(props);
  const { item = {} } = props;
  const { tabs = [] } = props.collection;
  const activeTab = tabs.find(tab => tab.name == item.tabName)||{};
  console.log(activeTab);
  const { data = {}, loading } = useRequest(() => activeTab && api.resource(activeTab.collection_name).getPageInfo({
    resourceKey: item.itemId,
  }));
  console.log(data);
  if (!activeTab) {
    return null;
  }
  if (loading) {
    return <Spin/>;
  }
  return (
    <div>
      <PageHeader
        ghost={false}
        onBack={() => {
          redirectTo({
            ...props.match.params,
            removeLastItem: true,
          });
        }}
        title={data.pageTitle}
        // subTitle="This is a subtitle"
        extra={[
          // <Button key="3">Operation</Button>,
          // <Button key="2">Operation</Button>,
          // <Button key="1" type="primary">
          //   Primary
          // </Button>,
        ]}
        footer={
          <Tabs size={'small'}
            defaultActiveKey={`${activeTab.name}`}
            onTabClick={(activeKey) => {
              redirectTo({
                ...props.match.params,
                lastItem: {
                  tabName: activeKey,
                },
              });
            }}
          >
            {tabs.map(tab => <Tabs.TabPane tab={tab.title} key={`${tab.name}`} />)}
          </Tabs>
        }
      />
      <div className={'collection-content'}>
        <CollectionTabPane {...props} pageInfo={data} activeTab={activeTab}/>
      </div>
    </div>
  );
}

export default CollectionSingle;
