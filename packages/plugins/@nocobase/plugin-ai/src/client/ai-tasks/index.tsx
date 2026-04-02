/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useApp } from '@nocobase/client';
import { useMemo } from 'react';
import { AIEmployeeTaskModel } from './flow-models/task';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { BaseAIEmployeeProperties } from './types';
import { AIEmployeeTaskFeedbackModel } from './flow-models/feedback';

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
