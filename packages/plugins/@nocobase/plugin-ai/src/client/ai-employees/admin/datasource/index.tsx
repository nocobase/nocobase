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
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { DatasourceSettingModel } from './flow-models';

export const DatasourceSettingPage: React.FC = () => {
  const app = useApp();
  const model = app.flowEngine.createModel({
    use: DatasourceSettingModel,
  });

  return <FlowModelRenderer model={model} />;
};
