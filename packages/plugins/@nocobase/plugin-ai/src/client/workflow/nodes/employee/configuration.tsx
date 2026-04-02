/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tabs } from 'antd';
import { Schema } from '@formily/react';
import { useT } from '../../../locale';
import { BaseAIEmployeeProperties, Feedback, Task } from '../../../ai-tasks';

export const Configuration: React.FC<BaseAIEmployeeProperties> = ({ children, ...properties }) => {
  const t = useT();
  const items = [
    {
      key: 'task',
      label: Schema.compile('{{t("Task")}}', { t }),
      children: <Task {...properties} />,
    },
    {
      key: 'feedback',
      label: Schema.compile('{{t("Feedback & Notification")}}', { t }),
      children: <Feedback />,
    },
  ];
  return <Tabs items={items} />;
};
