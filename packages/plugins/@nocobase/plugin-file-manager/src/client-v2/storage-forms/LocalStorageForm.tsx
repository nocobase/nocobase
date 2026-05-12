/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Input } from 'antd';
import React from 'react';
import {
  DefaultField,
  FileSizeField,
  MimetypeField,
  NameField,
  ParanoidField,
  PathField,
  RenameModeField,
  TitleField,
} from '../components';

export default function LocalStorageForm() {
  return (
    <>
      <TitleField />
      <NameField />
      <Form.Item name="baseUrl" hidden>
        <Input />
      </Form.Item>
      <Form.Item name={['options', 'documentRoot']} hidden>
        <Input />
      </Form.Item>
      <PathField addonBefore="storage/uploads/" />
      <RenameModeField />
      <FileSizeField />
      <MimetypeField />
      <DefaultField />
      <ParanoidField />
    </>
  );
}
