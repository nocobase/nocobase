/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MultiPortalsPage, {
  createMultiPortal,
  type MultiPortalFormValues,
  type MultiPortalResource,
} from '../pages/MultiPortalsPage';

const flowContext = vi.hoisted(() => ({
  current: undefined as
    | {
        api: {
          request: ReturnType<typeof vi.fn>;
          resource: ReturnType<typeof vi.fn>;
        };
        viewer: {
          drawer: ReturnType<typeof vi.fn>;
        };
      }
    | undefined,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'random-id',
    useFlowEngine: () => ({
      context: {
        t: (key: string) => key,
      },
    }),
    useFlowContext: () => flowContext.current,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    DrawerFormLayout: (props: { children: React.ReactNode; title: string; onSubmit: () => void; submitText: string }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': props.title },
        props.children,
        ReactModule.createElement('button', { type: 'button', onClick: props.onSubmit }, props.submitText),
      ),
  };
});

const portalValues: MultiPortalFormValues = {
  title: 'Customer portal',
  uid: 'customer-portal',
  routeName: 'customerPortal',
  routePath: '/customer-portal',
  uiLayoutUid: 'mobile-layout-model',
  enabled: true,
};

function makeResource(overrides: Partial<MultiPortalResource> = {}): MultiPortalResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({
      data: {
        data: [],
      },
    }),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  flowContext.current = undefined;
});

describe('plugin-multi-portal settings page', () => {
  it('should fire resource.create with portal fields including uiLayoutUid', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await createMultiPortal({ resource, values: portalValues, onSubmitted });

    expect(resource.create).toHaveBeenCalledWith({ values: portalValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should render portal management table without permission or UI layout wording', async () => {
    const multiPortalsResource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              uiLayout: {
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            uid: 'mobile-layout-model',
            title: 'Mobile layout',
          },
        ],
      },
    });
    flowContext.current = {
      api: {
        request,
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return multiPortalsResource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };

    const { container } = render(
      <AntdApp>
        <MultiPortalsPage />
      </AntdApp>,
    );

    expect(await screen.findByText('Customer portal')).toBeInTheDocument();
    expect(screen.getByText('UID')).toBeInTheDocument();
    expect(screen.getByText('Route name')).toBeInTheDocument();
    expect(screen.getByText('Access path')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View/ })).toHaveAttribute('href', '/customer-portal');
    expect(container.querySelector('.ant-tag')).toHaveTextContent('Mobile layout');
    expect(screen.queryByText('UI layout')).not.toBeInTheDocument();
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument();
    expect(multiPortalsResource.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      sort: ['uid'],
      appends: ['uiLayout'],
    });
  });

  it('should open create form with portal fields and layout selection', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            uid: 'mobile-layout-model',
            title: 'Mobile layout',
          },
        ],
      },
    });
    flowContext.current = {
      api: {
        request,
        resource: vi.fn((name: string) => {
          if (name === 'multiPortals') {
            return resource;
          }
          throw new Error(`Unexpected resource ${name}`);
        }),
      },
      viewer: {
        drawer: vi.fn((options: { content: () => React.ReactNode }) => {
          drawerContent = options.content();
        }),
      },
    };

    const { rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add Multi-Portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add Multi-Portal' });
    expect(within(dialog).getByLabelText('Title')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('UID')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Route name')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Access path')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Layout')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Enabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('UI layout')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/permission/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: 'uiLayouts:list',
        method: 'get',
        params: {
          pageSize: 200,
          sort: ['uid'],
        },
        skipNotify: true,
      });
    });
  });
});
