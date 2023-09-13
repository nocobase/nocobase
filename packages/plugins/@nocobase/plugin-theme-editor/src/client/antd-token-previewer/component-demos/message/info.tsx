import { message } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { _InternalPanelDoNotUseOrYouWillBeFired } = message;

const Demo = () => <_InternalPanelDoNotUseOrYouWillBeFired type={'info'} content={'Info'} />;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorInfo'],
  key: 'info',
};

export default componentDemo;
