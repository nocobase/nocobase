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
  RenameModeField,
  TitleField,
  UseOriginalUrlField,
} from '../components';
import { useT } from '../locale';

export default function TxCosStorageForm() {
  const t = useT();
  const requiredRule = [{ required: true, message: t('The field value is required') }];
  return (
    <>
      <TitleField />
      <NameField />
      <BaseUrlField />
      <Form.Item name={['options', 'Region']} label={`${t('Region')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'SecretId']} label={`${t('SecretId')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'SecretKey']} label={`${t('SecretKey')} :`} rules={requiredRule}>
        <EnvVariableInput password />
      </Form.Item>
      <Form.Item name={['options', 'Bucket']} label={`${t('Bucket')} :`} rules={requiredRule}>
        <EnvVariableInput />
      </Form.Item>
      <Form.Item name={['options', 'thumbnailRule']} label={`${t('Thumbnail rule')} :`}>
        <EnvVariableInput placeholder="?imageMogr2/thumbnail/!50p" />
      </Form.Item>
      <PathField />
      <RenameModeField />
      <FileSizeField />
      <MimetypeField />
      <UseOriginalUrlField />
      <DefaultField />
      <ParanoidField />
    </>
  );
}
