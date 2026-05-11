/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { EmbedLayoutModelV2, getEmbedLayoutModel } from './EmbedLayoutModel';

const EmbedLayout = (props: any) => {
  const flowEngine = useFlowEngine();
  const model = getEmbedLayoutModel(flowEngine, {
    create: true,
    props,
    use: EmbedLayoutModelV2,
  });

  if (!model) {
    throw new Error('[NocoBase] Failed to create embed-layout-model.');
  }

  return <FlowModelRenderer model={model} />;
};

export default EmbedLayout;
