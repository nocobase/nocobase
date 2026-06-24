/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Form, Tabs } from 'antd';
import { DEFAULT_AI_EMPLOYEE_USERNAME } from '../../../constants';
import { useT } from '../../../../locale';
import { AIEmployeeSelect } from './AIEmployeeSelect';

export function AIEmployeeFieldset() {
  const t = useT();
  const form = Form.useFormInstance();

  return (
    <Tabs
      items={[
        {
          key: 'task',
          label: t('Task'),
          forceRender: true,
          children: (
            <Form.Item
              name={['config', 'username']}
              label={t('AI employee')}
              tooltip={t('Choose the AI employee for this task')}
              initialValue={DEFAULT_AI_EMPLOYEE_USERNAME}
              rules={[{ required: true }]}
            >
              <AIEmployeeSelect
                onChange={(username) => {
                  form.setFieldValue(['config', 'username'], username);
                  form.setFieldValue(['config', 'skillSettings', 'skills'], undefined);
                  form.setFieldValue(['config', 'skillSettings', 'tools'], undefined);
                }}
              />
            </Form.Item>
          ),
        },
        {
          key: 'feedback',
          label: t('Feedback & Notification'),
          forceRender: true,
          children: null,
        },
      ]}
    />
  );
}

export default AIEmployeeFieldset;
