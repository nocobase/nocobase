/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  define: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  BasePageMenuModel: class {
    static define = holder.define;

    context: Record<string, unknown> = {};
    parentId?: string;
    uid = 'workflow-v1-menu-model';
  },
}));

vi.mock('../../WorkflowTasks', async () => {
  const ReactModule = await import('react');
  return {
    WorkflowTasksPageMenuContent: () =>
      ReactModule.createElement('div', {
        'data-testid': 'workflow-tasks-v1-content',
      }),
    WorkflowTasksPageMenuRouteProvider: ({ children, pageUid }: { children: React.ReactNode; pageUid?: string }) =>
      ReactModule.createElement(
        'div',
        { 'data-page-uid': pageUid, 'data-testid': 'workflow-tasks-v1-route-provider' },
        children,
      ),
  };
});

vi.mock('../../../client-v2/locale', () => ({
  tExpr: (key: string) => key,
}));

import { WorkflowTasksPageMenuModel } from '../WorkflowTasksPageMenuModel';

describe('WorkflowTasksPageMenuModel v1', () => {
  it('defines the workflow tasks page menu route', () => {
    expect(holder.define).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'CheckCircleOutlined',
        label: 'Workflow todos',
        routeType: 'workflowTasks',
      }),
    );
  });

  it('renders the v1 workflow task content with the current route uid', () => {
    const model = new WorkflowTasksPageMenuModel();
    model.context = {
      currentRoute: { schemaUid: 'workflow-v1-menu-route' },
    };

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('workflow-tasks-v1-route-provider')).toHaveAttribute(
      'data-page-uid',
      'workflow-v1-menu-route',
    );
    expect(screen.getByTestId('workflow-tasks-v1-content')).toBeInTheDocument();
  });

  it('falls back to the model uid when the current route is unavailable', () => {
    const model = new WorkflowTasksPageMenuModel();

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('workflow-tasks-v1-route-provider')).toHaveAttribute(
      'data-page-uid',
      'workflow-v1-menu-model',
    );
  });

  it('uses the parent route uid when the current route is temporarily unavailable', () => {
    const model = new WorkflowTasksPageMenuModel();
    model.parentId = 'workflow-v1-menu-route';
    model.context = {
      currentRoute: { schemaUid: 'normal-page-route' },
    };
    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('workflow-tasks-v1-route-provider')).toHaveAttribute(
      'data-page-uid',
      'workflow-v1-menu-route',
    );
  });
});
