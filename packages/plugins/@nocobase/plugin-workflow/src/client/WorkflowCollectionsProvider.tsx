/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ExtendCollectionsProvider } from '@nocobase/client';

import executions from '../common/collections/executions';
import flow_nodes from '../common/collections/flow_nodes';
import workflows from '../common/collections/workflows';
import workflowCategories from '../common/collections/workflowCategories';

export function WorkflowCollectionsProvider(props) {
  return (
    <ExtendCollectionsProvider collections={[workflows, flow_nodes, executions, workflowCategories]}>
      {props.children}
    </ExtendCollectionsProvider>
  );
}
