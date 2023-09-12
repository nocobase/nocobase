import { Modal } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => {
  return (
    <Modal._InternalPanelDoNotUseOrYouWillBeFired type={'success'}>
      A good news!
    </Modal._InternalPanelDoNotUseOrYouWillBeFired>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'success',
};
export default componentDemo;
