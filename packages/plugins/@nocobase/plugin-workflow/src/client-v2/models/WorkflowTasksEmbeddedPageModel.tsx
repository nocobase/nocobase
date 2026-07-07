/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../locale';
import { WorkflowTasksContent, WorkflowTasksEmbeddedRouteProvider } from '../pages/WorkflowTasksPage';

function WorkflowTasksEmbeddedPage() {
  return (
    <WorkflowTasksEmbeddedRouteProvider>
      <WorkflowTasksContent forceMobile />
    </WorkflowTasksEmbeddedRouteProvider>
  );
}

export class WorkflowTasksEmbeddedPageModel extends ChildPageModel {
  render() {
    return <WorkflowTasksEmbeddedPage />;
  }

  renderFirstTab() {
    return <WorkflowTasksEmbeddedPage />;
  }
}

WorkflowTasksEmbeddedPageModel.define({
  hide: true,
  label: tExpr('Workflow todos'),
});

export default WorkflowTasksEmbeddedPageModel;
