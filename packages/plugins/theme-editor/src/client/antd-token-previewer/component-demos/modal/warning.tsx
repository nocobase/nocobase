import { Modal } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => {
  return (
    <Modal._InternalPanelDoNotUseOrYouWillBeFired type={'confirm'} title={'Confirm This?'}>
      Some descriptions.
    </Modal._InternalPanelDoNotUseOrYouWillBeFired>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorWarning'],
  key: 'warning',
};
export default componentDemo;
