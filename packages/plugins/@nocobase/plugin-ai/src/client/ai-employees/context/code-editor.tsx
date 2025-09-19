/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { WorkContextOptions } from '../types';
import { CodeOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
// @ts-ignore
import _ from 'lodash';
import { Space } from 'antd';
import { codeEditorStore } from '../ai-coding/stores';

export const CodeEditorContext: WorkContextOptions = {
  name: 'code-editor',
  tag: {
    Component: ({ item }) => {
      const t = useT();
      return (
        <Space>
          <CodeOutlined />
          <span>{t('Code editor')}</span>
        </Space>
      );
    },
  },
  getContent: async (app, { uid }) => {
    return codeEditorStore.read();
  },
};
