import { InboxOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import React from 'react';
import { usePluginUtils } from './hooks/i18';

const { Dragger } = Upload;

export const DraggerUpload = (props) => {
  const { t } = usePluginUtils();

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{t('Click or drag file to this area to upload')}</p>
      <p className="ant-upload-hint">{t('Only support uploading backup files exported from NocoBase')}</p>
    </Dragger>
  );
};
