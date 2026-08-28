/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CodeOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import type { WorkContextOptions } from '../types';

type CodeEditorContent = {
  code?: string;
};

const isCodeEditorContent = (value: unknown): value is CodeEditorContent =>
  !!value && typeof value === 'object' && !Array.isArray(value) && 'code' in value;

export const CodeEditorContext: WorkContextOptions = {
  name: 'code-editor',
  tag: {
    Component: ({ item }) => (
      <Space>
        <CodeOutlined />
        <span>{item.title}</span>
      </Space>
    ),
  },
  getContent: async (_app, { content }) => {
    if (isCodeEditorContent(content)) {
      return content.code ?? '';
    }
    return '';
  },
};
