/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card } from 'antd';
import { messageManagerSchema, createMessageFormSchema } from '../schemas';
import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useAsyncData,
  usePlugin,
  SchemaComponentOptions,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNotificationTranslation } from '../../../locale';
import { useTranslation } from 'react-i18next';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

export const MessageManager = () => {
  const { t } = useNotificationTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <Card bordered={false}>
        <SchemaComponent schema={messageManagerSchema} scope={{ t }} />
      </Card>
    </SchemaComponentContext.Provider>
  );
};

MessageManager.displayName = 'MessageManager';
