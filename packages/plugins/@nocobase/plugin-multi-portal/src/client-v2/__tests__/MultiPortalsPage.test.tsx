/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App as AntdApp } from 'antd';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    DrawerFormLayout: (props: {
      children: React.ReactNode;
      title: string;
      onSubmit: () => Promise<void> | void;
      submitText: string;
    }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': props.title },
        props.children,
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: async () => {
              try {
                await props.onSubmit();
              } catch {
                // Keep the test drawer mounted after form validation rejects.
              }
            },
          },
          props.submitText,
        ),
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
    expect(screen.queryByText('Route name')).not.toBeInTheDocument();
    expect(screen.queryByText('customerPortal')).not.toBeInTheDocument();
    const toolbar = container.querySelector('.ant-flex');
    expect(within(toolbar as HTMLElement).getByRole('button', { name: /Delete/ })).not.toHaveClass('ant-btn-dangerous');
    expect(screen.getByText('Access path')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View/ })).toHaveAttribute('href', '/customer-portal');
    const actionCell = container.querySelector('tbody tr .ant-table-cell:last-child');
    const actionButtons = actionCell?.querySelectorAll('.ant-btn-link') ?? [];
    expect(actionButtons).toHaveLength(3);
    actionButtons.forEach((button) => {
      expect(button).toHaveStyle('padding-inline: 0');
    });
    expect(within(actionCell as HTMLElement).getByRole('button', { name: /Delete/ })).not.toHaveClass(
      'ant-btn-dangerous',
    );
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

    await user.click(await screen.findByRole('button', { name: /Add Multi-portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add Multi-portal' });
    expect(within(dialog).getByLabelText('Title')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('UID')).toHaveValue('portal-random-id');
    expect(within(dialog).queryByLabelText('Route name')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Access path')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Layout')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Enabled')).toBeInTheDocument();
    expect(within(dialog).getByText('Must start with /. For example: /portal.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('When disabled, this portal will not be registered or accessible.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('UI layout')).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/permission/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        url: 'uiLayouts:listEnabled',
        method: 'get',
        params: {
          pageSize: 200,
          sort: ['uid'],
        },
        skipNotify: true,
      });
    });
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'uiLayouts:list' }));
  });

  it('should derive route name from access path when creating a portal', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
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

    const { container, rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add Multi-portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add Multi-portal' });
    await user.type(within(dialog).getByLabelText('Title'), 'Admin portal');
    await user.clear(within(dialog).getByLabelText('UID'));
    await user.type(within(dialog).getByLabelText('UID'), 'admin-portal');
    await user.type(within(dialog).getByLabelText('Access path'), ' /admin ');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile layout'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith({
        values: {
          title: 'Admin portal',
          uid: 'admin-portal',
          routeName: 'admin',
          routePath: '/admin',
          uiLayoutUid: 'mobile-layout-model',
          enabled: true,
        },
      });
    });
  });

  it('should populate the layout field from the appended uiLayout relation when editing', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
      list: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              ...portalValues,
              uiLayoutUid: undefined,
              uiLayout: {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            },
          ],
        },
      }),
    });
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
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

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit Multi-portal' });
    expect(await within(dialog).findByText('Mobile layout')).toBeInTheDocument();
  });

  it('should reject access paths that derive route names with dots before submitting', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource();
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
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

    const { container, rerender } = render(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    await user.click(await screen.findByRole('button', { name: /Add Multi-portal/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Add Multi-portal' });
    await user.type(within(dialog).getByLabelText('Title'), 'Bad portal');
    await user.clear(within(dialog).getByLabelText('UID'));
    await user.type(within(dialog).getByLabelText('UID'), 'bad-portal');
    await user.type(within(dialog).getByLabelText('Access path'), '/foo.bar');

    fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
    await user.click(await screen.findByText('Mobile layout'));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('Route name cannot contain dots')).toBeInTheDocument();
    expect(resource.create).not.toHaveBeenCalled();
  });

  it('should reject invalid portal access paths before submitting', async () => {
    const user = userEvent.setup();
    let drawerContent: React.ReactNode;
    const resource = makeResource({
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
    flowContext.current = {
      api: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'mobile-layout-model',
                title: 'Mobile layout',
              },
            ],
          },
        }),
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

    await user.click(await screen.findByRole('button', { name: /Edit/ }));
    rerender(
      <AntdApp>
        <MultiPortalsPage />
        {drawerContent}
      </AntdApp>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Edit Multi-portal' });
    const accessPathInput = within(dialog).getByLabelText('Access path');
    await user.clear(accessPathInput);
    await user.type(accessPathInput, 'portal');
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('Access path must start with /')).toBeInTheDocument();
    expect(resource.update).not.toHaveBeenCalled();
  });
});
