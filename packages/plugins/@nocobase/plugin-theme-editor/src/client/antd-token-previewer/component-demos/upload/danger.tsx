import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <div>
    <Upload
      defaultFileList={[
        {
          uid: '3',
          name: 'zzz.png',
          status: 'error',
          response: 'Server Error 500',
          url: 'http://www.baidu.com/zzz.png',
        },
      ]}
    >
      <Button icon={<UploadOutlined />}>Upload</Button>
    </Upload>
    <Upload
      listType={'picture'}
      defaultFileList={[
        {
          uid: '3',
          name: 'zzz.png',
          status: 'error',
          response: 'Server Error 500',
        },
      ]}
    >
      <Button icon={<UploadOutlined />}>Upload</Button>
    </Upload>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorError', 'colorErrorBg'],
  key: 'danger',
};

export default componentDemo;
