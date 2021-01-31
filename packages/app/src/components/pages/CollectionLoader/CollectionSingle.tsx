import React, { useState } from 'react';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { CollectionTabPane } from './CollectionTabPane';
import { getPathName, redirectTo } from './utils';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import { Helmet } from 'umi';

export function CollectionSingle(props) {
  // console.log(props);
  const { item = {} } = props;
  const { data: collections = [], loading: collectionLoading } = useRequest(() => api.resource(props.match.params['collection']).getCollections({
    values: {
      tabs: props.match.params['items']
    }
  }));

  // const { data = {}, loading } = useRequest(() => currentTab && api.resource(currentTab.collection_name).getPageInfo({
  //   resourceKey: item.itemId,
  // }));

  const [activing, setActiving] = useState(false);

  if (collectionLoading) {
    return <Spin/>;
  }

  const collection = collections[props.itemIndex]||{};

  const { tabs = [] } = collection;
  const activeTab = tabs.find(tab => tab.name == item.tabName)||{};
  console.log({tabs, activeTab, item});

  if (!activeTab) {
    return null;
  }

  return (
    <div>
      <Helmet>
        <title>{collection.pageTitle}</title>
      </Helmet>
      <PageHeader
        ghost={false}
        onBack={() => {
          redirectTo({
            ...props.match.params,
            removeLastItem: true,
          });
        }}
        title={collection.pageTitle}
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
              setActiving(true);
              redirectTo({
                ...props.match.params,
                lastItem: {
                  tabName: activeKey,
                },
              });
              setTimeout(() => {
                setActiving(false);
              }, 2)
            }}
          >
            {tabs.map(tab => <Tabs.TabPane tab={tab.title} key={`${tab.name}`} />)}
          </Tabs>
        }
      />
      <div className={'collection-content'}>
        <CollectionTabPane {...props} collection={collection} loading={activing} activeTab={activeTab}/>
      </div>
    </div>
  );
}

export default CollectionSingle;
