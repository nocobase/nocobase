import { SettingsCenterProvider } from '@nocobase/client';
import { Card } from 'antd';
import React, { FC } from 'react';

const DuplicatorPanel = () => {
  return (
    <Card bordered={false}>
      <div>hello world</div>
    </Card>
  );
};

export const DuplicatorProvider: FC = function (props) {
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
};

DuplicatorProvider.displayName = 'DuplicatorProvider';
