/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildWorkflowTasksEmbeddedPath, parseWorkflowTasksEmbeddedRoute } from '../workflowTasksEmbeddedRoute';

describe('workflowTasksEmbeddedRoute', () => {
  it('parses lowercase workflow task segments after the current view uid', () => {
    expect(
      parseWorkflowTasksEmbeddedRoute({
        pathname: '/admin/home/view/workflow-entry/tasktype/approval/status/pending/popupid/123',
        viewUid: 'workflow-entry',
      }),
    ).toEqual({
      taskType: 'approval',
      status: 'pending',
      popupId: '123',
      search: '',
      hash: '',
    });
  });

  it('keeps the outer route prefix while replacing embedded workflow task segments', () => {
    expect(
      buildWorkflowTasksEmbeddedPath({
        pathname: '/admin/home/view/workflow-entry/tasktype/approval/status/pending/popupid/123',
        viewUid: 'workflow-entry',
        route: {
          taskType: 'cc',
          status: 'completed',
        },
      }),
    ).toBe('/admin/home/view/workflow-entry/tasktype/cc/status/completed');
  });

  it('does not assume whether the outer prefix is mobile or admin', () => {
    expect(
      buildWorkflowTasksEmbeddedPath({
        pathname: '/mobile/page-a/view/workflow-entry',
        viewUid: 'workflow-entry',
        route: {
          taskType: 'approval',
          status: 'pending',
          popupId: '9',
        },
      }),
    ).toBe('/mobile/page-a/view/workflow-entry/tasktype/approval/status/pending/popupid/9');
  });
});
