/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnvVariableInput } from '@nocobase/client-v2';
import { Form } from 'antd';
import React from 'react';
import {
  BaseUrlField,
  DefaultField,
  FileSizeField,
  MimetypeField,
  NameField,
  ParanoidField,
  PathField,
  PublicAccessField,
  RenameModeField,
  TitleField,
  UseOriginalUrlField,
} from '../components';
import { useT } from '../locale';

export default function S3StorageForm() {
  const t = useT();
  const requiredRule = [{ required: true, message: t('The field value is required') }];
  return (
    <>
      <TitleField />
      <NameField />
      <BaseUrlField />
      <Form.Item name={['options', 'region']} label={`${t('Region')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'accessKeyId']} label={`${t('AccessKey ID')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'secretAccessKey']} label={`${t('AccessKey Secret')} :`} rules={requiredRule}>
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item name={['options', 'bucket']} label={`${t('Bucket')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'endpoint']} label={`${t('Endpoint')} :`}>
        <EnvVariableInput />
      </Form.Item>
      <PathField />
      <RenameModeField />
      <FileSizeField />
      <MimetypeField />
      <UseOriginalUrlField />
      <PublicAccessField />
      <DefaultField />
      <ParanoidField />
    </>
  );
}
