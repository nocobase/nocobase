import React from 'react';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { CollectionTabPane } from './CollectionTabPane';
import { getPathName, redirectTo } from './utils';

export function CollectionSingle(props) {
  console.log(props);
  const { item = {} } = props;
  const { tabs = [] } = props.collection;
  const activeTab = tabs.find(tab => tab.name == item.tabName)||{};
  if (!activeTab) {
    return null;
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
        title={'企业信息库'}
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
        <CollectionTabPane {...props} activeTab={activeTab}/>
      </div>
    </div>
  );
}

export default CollectionSingle;
