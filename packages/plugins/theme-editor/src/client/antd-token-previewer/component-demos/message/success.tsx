import { message } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { _InternalPanelDoNotUseOrYouWillBeFired } = message;

const Demo = () => <_InternalPanelDoNotUseOrYouWillBeFired type={'success'} content={'这是一条成功消息，会主动消失'} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'success',
};

export default componentDemo;
