import { notification } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { _InternalPanelDoNotUseOrYouWillBeFired } = notification;

const Demo = () => (
  // @ts-ignore
  <_InternalPanelDoNotUseOrYouWillBeFired
    message={'Notification Title'}
    description={
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.'
    }
  />
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorIcon', 'colorIconHover', 'colorBgElevated'],
  key: 'default',
};

export default componentDemo;
