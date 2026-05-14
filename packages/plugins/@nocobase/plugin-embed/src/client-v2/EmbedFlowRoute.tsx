/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRoute } from '@nocobase/client-v2';
import type { FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { getEmbedLayoutModel } from './EmbedLayoutModel';

const getLayoutModel = (flowEngine: FlowEngine) => getEmbedLayoutModel(flowEngine, { required: true });

const EmbedFlowRoute = () => {
  return <FlowRoute getLayoutModel={getLayoutModel} legacyPageBehavior="notFound" />;
};

export default EmbedFlowRoute;
