import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { Card } from 'antd';

const DuplicatorPanel = () => {
  return (
    <Card bordered={false}>
      <div>hello world</div>
    </Card>
  );
};

export default function (props) {
  const ctx = useContext(PluginManagerContext);

  return (
    <SettingsCenterProvider
      settings={{
        duplicator: {
          title: '应用导入导出',
          icon: 'CloudDownloadOutlined',
          tabs: {
            tab1: {
              title: '应用导入导出',
              component: DuplicatorPanel,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
}
