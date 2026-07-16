/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildWorkflowTasksPageMenuPath, parseWorkflowTasksPageMenuRoute } from '../workflowTasksPageMenuRoute';

describe('workflowTasksPageMenuRoute', () => {
  it('parses lowercase workflow task segments after the page menu root uid', () => {
    expect(
      parseWorkflowTasksPageMenuRoute({
        pathname: '/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/123',
        pageUid: 'workflow-menu',
      }),
    ).toEqual({
      taskType: 'approval-apply',
      status: 'completed',
      popupId: '123',
      search: '',
      hash: '',
    });
  });

  it('keeps an arbitrary outer prefix while replacing workflow task segments', () => {
    expect(
      buildWorkflowTasksPageMenuPath({
        pathname: '/v/admin/workflow-menu/tasktype/approval-apply/status/completed/popupid/123',
        pageUid: 'workflow-menu',
        route: {
          taskType: 'cc',
          status: 'pending',
        },
      }),
    ).toBe('/v/admin/workflow-menu/tasktype/cc/status/pending');
  });

  it('preserves a requested completed detail route without normalizing it to pending', () => {
    const route = parseWorkflowTasksPageMenuRoute({
      pathname: '/mobile/workflow-menu/tasktype/approval/status/completed/popupid/9',
      pageUid: 'workflow-menu',
    });

    expect(route.status).toBe('completed');
    expect(
      buildWorkflowTasksPageMenuPath({
        pathname: '/mobile/workflow-menu',
        pageUid: 'workflow-menu',
        route,
      }),
    ).toBe('/mobile/workflow-menu/tasktype/approval/status/completed/popupid/9');
  });

  it('does not confuse a popup id with an identical page uid', () => {
    expect(
      parseWorkflowTasksPageMenuRoute({
        pathname: '/admin/123/tasktype/approval/status/completed/popupid/123',
        pageUid: '123',
      }),
    ).toMatchObject({
      taskType: 'approval',
      status: 'completed',
      popupId: '123',
    });
  });
});
