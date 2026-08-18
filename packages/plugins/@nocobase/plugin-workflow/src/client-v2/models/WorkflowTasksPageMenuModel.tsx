/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BasePageMenuModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../locale';
import { WorkflowTasksContent, WorkflowTasksPageMenuRouteProvider } from '../pages/WorkflowTasksPage';

type WorkflowTasksPageMenuContext = {
  currentRoute?: {
    schemaUid?: unknown;
  };
  isMobileLayout?: boolean;
};

export class WorkflowTasksPageMenuModel extends BasePageMenuModel {
  render() {
    const context = this.context as WorkflowTasksPageMenuContext;
    const parentRouteUid = this.parentId;
    const routeSchemaUid = context.currentRoute?.schemaUid;
    const pageUid =
      typeof parentRouteUid === 'string' && parentRouteUid
        ? parentRouteUid
        : typeof routeSchemaUid === 'string' && routeSchemaUid
          ? routeSchemaUid
          : this.uid;

    return (
      <WorkflowTasksPageMenuRouteProvider pageUid={pageUid}>
        <WorkflowTasksContent desktopTaskTypeNavigation="tabs" forceMobile={Boolean(context.isMobileLayout)} />
      </WorkflowTasksPageMenuRouteProvider>
    );
  }
}

WorkflowTasksPageMenuModel.define({
  icon: 'CheckCircleOutlined',
  label: tExpr('Workflow todos'),
  routeType: 'workflowTasks',
  sort: 300,
});

export default WorkflowTasksPageMenuModel;
