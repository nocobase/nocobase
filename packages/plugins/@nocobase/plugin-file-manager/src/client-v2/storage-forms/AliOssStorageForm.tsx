/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput, JsonTextArea } from '@nocobase/client-v2';
import { Form, InputNumber } from 'antd';
import React from 'react';
import {
  BaseUrlField,
  DefaultField,
  FileSizeField,
  MimetypeField,
  NameField,
  ParanoidField,
  PathField,
  RenameModeField,
  TitleField,
  UseOriginalUrlField,
} from '../components';
import { useT } from '../locale';

export default function AliOssStorageForm() {
  const t = useT();
  const requiredRule = [{ required: true, message: t('The field value is required') }];
  return (
    <>
      <TitleField />
      <NameField />
      <BaseUrlField />
      <Form.Item
        name={['options', 'region']}
        label={`${t('Region')} :`}
        rules={requiredRule}
        extra={t('Aliyun OSS region part of the bucket. For example: "oss-cn-beijing".')}
      >
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'accessKeyId']} label={`${t('AccessKey ID')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'accessKeySecret']} label={`${t('AccessKey Secret')} :`} rules={requiredRule}>
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item name={['options', 'bucket']} label={`${t('Bucket')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item
        name={['options', 'timeout']}
        label={`${t('Timeout')} :`}
        extra={t('Upload timeout for a single file in milliseconds. Default is 600000.')}
      >
        <InputNumber style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name={['options', 'thumbnailRule']} label={`${t('File pre-process parameters')} :`}>
        <EnvVariableInput placeholder="?x-oss-process=image/auto-orient,1/resize,m_fill,w_94,h_94/quality,q_90" />
      </Form.Item>
      <PathField />
      <RenameModeField />
      <UseOriginalUrlField />
      <FileSizeField />
      <MimetypeField />
      <DefaultField />
      <ParanoidField />
      <Form.Item
        name={['settings', 'requestOptions']}
        label={`${t('Request options')} :`}
        extra={t(
          'Additional options for HTTP requests when fetching files from remote storage on server side, such as headers.',
        )}
      >
        <JsonTextArea autoSize={{ minRows: 5 }} />
      </Form.Item>
    </>
  );
}
