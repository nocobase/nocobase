import { Tabs } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { TabPane } = Tabs;

const Demo = () => (
  <Tabs type={'card'} defaultActiveKey="1">
    <TabPane tab="Tab 1" key="1">
      Content of Tab Pane 1
    </TabPane>
    <TabPane tab="Tab 2" key="2">
      Content of Tab Pane 2
    </TabPane>
    <TabPane tab="Tab 3" key="3">
      Content of Tab Pane 3
    </TabPane>
  </Tabs>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillAlter'],
  key: 'cardTabs',
};

export default componentDemo;
