/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import React from 'react';

import type { ComponentDemo } from '../../interface';

const Demo = () => (
  <div>
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
    >
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
      </div>
    </Upload>
  </div>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorFillAlter'],
  key: 'avatar',
};

export default componentDemo;
