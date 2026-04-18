/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Tabs } from 'antd';
import { Schema } from '@formily/react';
import { useT } from '../../../locale';
import { AIEmployeeTaskModel } from './flow-models/task';
import { useApp } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { AIEmployeeTaskFeedbackModel } from './flow-models/feedback';
import { BaseAIEmployeeProperties } from './types';

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

export const Task: React.FC<BaseAIEmployeeProperties> = ({ aiEmployee }) => {
  const app = useApp();
  const model = useMemo(() => {
    return app.flowEngine.createModel({
      use: AIEmployeeTaskModel,
      props: {
        aiEmployee,
      },
    });
  }, [app, aiEmployee]);

  return <FlowModelRenderer model={model} />;
};

export const Feedback: React.FC = () => {
  const app = useApp();
  const model = useMemo(() => {
    return app.flowEngine.createModel({
      use: AIEmployeeTaskFeedbackModel,
    });
  }, [app]);

  return <FlowModelRenderer model={model} />;
};

export * from './types';
