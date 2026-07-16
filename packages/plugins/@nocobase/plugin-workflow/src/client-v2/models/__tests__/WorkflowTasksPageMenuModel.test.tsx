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
    uid = 'workflow-menu-model';
  },
}));

vi.mock('../../pages/WorkflowTasksPage', async () => {
  const ReactModule = await import('react');
  return {
    WorkflowTasksContent: ({
      desktopTaskTypeNavigation,
      forceMobile,
    }: {
      desktopTaskTypeNavigation?: string;
      forceMobile?: boolean;
    }) =>
      ReactModule.createElement('div', {
        'data-desktop-task-type-navigation': desktopTaskTypeNavigation,
        'data-force-mobile': String(forceMobile),
        'data-testid': 'workflow-tasks-content',
      }),
    WorkflowTasksPageMenuRouteProvider: ({ children, pageUid }: { children: React.ReactNode; pageUid?: string }) =>
      ReactModule.createElement(
        'div',
        { 'data-page-uid': pageUid, 'data-testid': 'page-menu-route-provider' },
        children,
      ),
  };
});

vi.mock('../../locale', () => ({
  tExpr: (key: string) => key,
}));

import { WorkflowTasksPageMenuModel } from '../WorkflowTasksPageMenuModel';

describe('WorkflowTasksPageMenuModel', () => {
  it('defines the workflow tasks page menu route', () => {
    expect(holder.define).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'CheckCircleOutlined',
        label: 'Workflow todos',
        routeType: 'workflowTasks',
      }),
    );
  });

  it('renders desktop content with top task type tabs and the current route uid', () => {
    const model = new WorkflowTasksPageMenuModel();
    model.context = {
      currentRoute: { schemaUid: 'workflow-menu-route' },
      isMobileLayout: false,
    };

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('page-menu-route-provider')).toHaveAttribute('data-page-uid', 'workflow-menu-route');
    expect(screen.getByTestId('workflow-tasks-content')).toHaveAttribute('data-force-mobile', 'false');
    expect(screen.getByTestId('workflow-tasks-content')).toHaveAttribute('data-desktop-task-type-navigation', 'tabs');
  });

  it('forces the existing mobile task content in a mobile layout', () => {
    const model = new WorkflowTasksPageMenuModel();
    model.context = {
      currentRoute: { schemaUid: 'workflow-menu-route' },
      isMobileLayout: true,
    };

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('workflow-tasks-content')).toHaveAttribute('data-force-mobile', 'true');
  });

  it('falls back to the model uid when the current route is not available', () => {
    const model = new WorkflowTasksPageMenuModel();
    model.context = { isMobileLayout: false };

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('page-menu-route-provider')).toHaveAttribute('data-page-uid', 'workflow-menu-model');
  });
});
