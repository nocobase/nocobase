/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useFieldSchema, useForm } from '@formily/react';
import { AIEmployeeChatContext } from './AIEmployeeChatProvider';
import { EditOutlined } from '@ant-design/icons';
import { useT } from '../locale';

export const useDetailsAIEmployeeChatContext = () => {
  return {};
};

export const useFormAIEmployeeChatContext = (): AIEmployeeChatContext => {
  const t = useT();
  const fieldSchema = useFieldSchema();
  const form = useForm();
  return {
    attachments: {
      formSchema: {
        title: t('Current form'),
        type: 'uiSchema',
        description: 'The JSON schema of the form',
        content: fieldSchema.parent.parent['x-uid'],
      },
    },
    actions: {
      setFormValues: {
        title: t('Set form values'),
        icon: <EditOutlined />,
        action: (content: string) => {
          try {
            form.setValues(JSON.parse(content));
          } catch (error) {
            console.error(error);
          }
        },
      },
    },
  };
};
