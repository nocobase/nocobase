---
title: Upload - 上传
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Upload - 上传

## 代码演示

### 上传

```tsx
import React from 'react';
import { Button } from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import { Field, registerFieldComponents } from '@nocobase/client';
import Upload from './';

const NormalUpload = (props) => {
  return (
    <Upload
      {...props}
      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
      headers={{
        authorization: 'authorization-text',
      }}
    >
      <Button icon={<UploadOutlined />}>上传文件</Button>
    </Upload>
  )
}

registerFieldComponents({
  NormalUpload,
});

const schema = [
  {
    interface: 'icon',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'NormalUpload',
    'x-reactions': {
      target: 'name2',
      fulfill: {
        state: {
          value: '{{$self.value}}',
        },
      },
    },
  },
  {
    interface: 'icon',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'NormalUpload',
  },
];

const data = {
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```
