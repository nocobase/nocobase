import React, { useState } from 'react'
import { connect } from '@formily/react-schema-renderer'
import { Button, Upload as AntdUpload, Popconfirm } from 'antd'
import { toArr, isArr, isEqual, mapStyledProps } from '../shared'
import {
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
  InboxOutlined
} from '@ant-design/icons'
const { Dragger: UploadDragger } = AntdUpload

function toFileObject(item) {
  if (item.id && item.uid && item.url) {
    return item;
  }
  if (item.response && item.response.data) {
    return toFileObject(item.response.data);
  }
  return {
    id: item.id,
    uid: `${item.id}`,
    name: item.title,
    url: item.url,
    status: 'done',
  };
}

function toFileList(value: any) {
  if (!value) {
    return [];
  }
  if (!Array.isArray(value) && typeof value === 'object') {
    value = [value];
  }
  return value.map(toFileObject);
}

export const Upload = connect({
  getProps: mapStyledProps
})((props) => {
  const { value, onChange } = props;
  const [fileList, setFileList] = useState(toFileList(value));
  const uploadProps = {
    name: 'file',
    action: `${process.env.API}/attachments:upload`,
    onChange({ file, fileList }) {
      if (file.status === 'done') {
        const values = toFileList(fileList);
        console.log(values);
        setFileList(values);
        onChange(values.map(item => item.id));
      }
    },
  };
  return (
    <div>
      <AntdUpload
        {...uploadProps}
        fileList={fileList}
      >
        <Button><UploadOutlined /> 上传文件</Button>
      </AntdUpload>
    </div>
  )
});

export default Upload;