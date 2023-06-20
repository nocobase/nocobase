import { SettingsCenterProvider } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

const DuplicatorPanel = () => {
  return (
    <Card bordered={false}>
      <div>hello world</div>
    </Card>
  );
};

export default function (props) {
  return (
    <SettingsCenterProvider
      settings={
        {
          // duplicator: {
          //   title: '应用导入导出',
          //   icon: 'CloudDownloadOutlined',
          //   tabs: {
          //     tab1: {
          //       title: '应用导入导出',
          //       component: DuplicatorPanel,
          //     },
          //   },
          // },
        }
      }
    >
      {props.children}
    </SettingsCenterProvider>
  );
}
