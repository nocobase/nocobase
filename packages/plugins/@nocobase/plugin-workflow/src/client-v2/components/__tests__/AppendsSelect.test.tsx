/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppendsSelect } from '../collection/AppendsSelect';

type TreeSelectNodeSnapshot = {
  fullTitle?: string[];
  key: string;
  loadChildren?: (option: TreeSelectNodeSnapshot) => TreeSelectNodeSnapshot[];
  title: string;
  value: string;
};

type TreeSelectPropsSnapshot = {
  loadData?: (option?: TreeSelectNodeSnapshot) => void | Promise<void>;
  onChange?: (value: Array<{ label?: React.ReactNode; value?: string }>) => void;
  placeholder?: string;
  showCheckedStrategy?: string;
  tagRender?: (props: {
    closable?: boolean;
    disabled?: boolean;
    onClose?: () => void;
    value?: string;
  }) => React.ReactNode;
  treeCheckable?: boolean;
  treeCheckStrictly?: boolean;
  treeData?: TreeSelectNodeSnapshot[];
  treeDataSimpleMode?: boolean;
  value?: Array<{ label?: React.ReactNode; value?: string }>;
};

const treeSelectState = vi.hoisted(() => ({
  props: null as null | TreeSelectPropsSnapshot,
}));

vi.mock('antd', () => {
  const Tag = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;
  const TreeSelect = (props: TreeSelectPropsSnapshot) => {
    treeSelectState.props = props;
    return <div data-testid="tree-select" />;
  };
  Object.assign(TreeSelect, {
    SHOW_ALL: 'SHOW_ALL',
    SHOW_PARENT: 'SHOW_PARENT',
  });
  return { Tag, TreeSelect };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: (collectionName: string) => {
              const fields: Record<string, Array<Record<string, unknown>>> = {
                profiles: [],
                roles: [
                  {
                    options: {
                      interface: 'm2o',
                      name: 'createdBy',
                      target: 'users',
                      type: 'belongsTo',
                      uiSchema: { title: '{{t("Created by")}}' },
                    },
                  },
                ],
                root: [
                  {
                    interface: 'm2o',
                    name: 'createdBy',
                    target: 'users',
                    type: 'belongsTo',
                    uiSchema: { title: '{{t("Created by")}}' },
                  },
                  {
                    interface: 'oho',
                    name: 'profile',
                    target: 'profiles',
                    type: 'hasOne',
                    uiSchema: { title: '{{t("Profile")}}' },
                  },
                ],
                users: [
                  {
                    options: {
                      interface: 'm2o',
                      name: 'createdBy',
                      target: 'users',
                      type: 'belongsTo',
                      uiSchema: { title: '{{t("Created by")}}' },
                    },
                  },
                  {
                    options: {
                      interface: 'm2o',
                      name: 'role',
                      target: 'roles',
                      type: 'belongsTo',
                      uiSchema: { title: '{{t("Role")}}' },
                    },
                  },
                  {
                    options: {
                      interface: 'm2m',
                      name: 'roles',
                      target: 'roles',
                      type: 'belongsToMany',
                      uiSchema: { title: '{{t("Roles")}}' },
                    },
                  },
                ],
              };
              return {
                getFields: () => fields[collectionName] ?? [],
              };
            },
          },
        }),
      },
    },
  }),
}));

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\("(.+)"(?:,\s*\{.*\})?\)}}$/);
    return matched?.[1] ?? key;
  },
}));

describe('AppendsSelect', () => {
  it('uses the v1 tree-select strategy and compiles association field titles', () => {
    render(<AppendsSelect collection="root" />);

    expect(screen.getByTestId('tree-select')).toBeInTheDocument();
    expect(treeSelectState.props?.placeholder).toBe('Select field');
    expect(treeSelectState.props?.showCheckedStrategy).toBe('SHOW_ALL');
    expect(treeSelectState.props?.treeCheckStrictly).toBe(true);
    expect(treeSelectState.props?.treeCheckable).toBe(true);
    expect(treeSelectState.props?.treeDataSimpleMode).toBe(true);
    expect(treeSelectState.props?.treeData).toEqual([
      expect.objectContaining({
        title: 'Created by',
        value: 'createdBy',
      }),
      expect.objectContaining({
        title: 'Profile',
        value: 'profile',
      }),
    ]);
  });

  it('preloads saved child paths and renders full path tags', async () => {
    render(<AppendsSelect collection="root" value={['createdBy.roles']} />);

    await waitFor(() => {
      expect(treeSelectState.props?.treeData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Roles',
            value: 'createdBy.roles',
          }),
        ]),
      );
    });

    const tag = treeSelectState.props?.tagRender?.({ value: 'createdBy.roles' });
    render(<>{tag}</>);

    expect(screen.getByText('Created by / Roles')).toBeInTheDocument();
  });

  it('uses strict tree checking and full-path tag rendering to match v1 appends behavior', async () => {
    render(<AppendsSelect collection="users" value={['createdBy.role']} />);

    expect(treeSelectState.props?.treeCheckStrictly).toBe(true);
    expect(treeSelectState.props?.showCheckedStrategy).toBe('SHOW_ALL');

    await waitFor(() => {
      expect(treeSelectState.props?.value).toMatchObject([{ label: 'createdBy.role', value: 'createdBy.role' }]);
    });

    const tag = treeSelectState.props?.tagRender?.({
      closable: true,
      onClose: vi.fn(),
      value: 'createdBy.role',
    });
    const { container } = render(<>{tag}</>);
    expect(container).toHaveTextContent('Created by / Role');
  });

  it('adds parent paths when a child node is selected', () => {
    const onChange = vi.fn();
    render(<AppendsSelect collection="users" value={[]} onChange={onChange} />);

    treeSelectState.props?.onChange?.([{ label: 'createdBy.role', value: 'createdBy.role' }]);
    expect(onChange).toHaveBeenCalledWith(['createdBy.role', 'createdBy']);
  });

  it('removes descendants when a selected parent node is unselected', () => {
    const onChange = vi.fn();
    render(<AppendsSelect collection="users" value={['createdBy', 'createdBy.role']} onChange={onChange} />);

    treeSelectState.props?.onChange?.([{ label: 'createdBy.role', value: 'createdBy.role' }]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('continues loading deeper association levels on demand', async () => {
    render(<AppendsSelect collection="users" value={[]} />);

    await act(async () => {
      await treeSelectState.props?.loadData?.(
        treeSelectState.props?.treeData?.find((item) => item.value === 'createdBy'),
      );
    });

    await waitFor(() => {
      expect(treeSelectState.props?.treeData).toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'createdBy.createdBy' })]),
      );
    });

    await act(async () => {
      await treeSelectState.props?.loadData?.(
        treeSelectState.props?.treeData?.find((item) => item.value === 'createdBy.createdBy'),
      );
    });

    await waitFor(() => {
      expect(treeSelectState.props?.treeData).toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'createdBy.createdBy.createdBy' })]),
      );
    });
  });

  it('loads children from a legacy tree-select node by value', async () => {
    render(<AppendsSelect collection="users" value={[]} />);

    await act(async () => {
      await treeSelectState.props?.loadData?.({
        key: 'createdBy',
        title: 'Created by',
        value: 'createdBy',
      });
    });

    await waitFor(() => {
      expect(treeSelectState.props?.treeData).toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'createdBy.createdBy' })]),
      );
    });
  });

  it('preloads nested value paths so deep selections can be displayed', async () => {
    render(<AppendsSelect collection="users" value={['createdBy.createdBy.role']} />);

    await waitFor(() => {
      expect(treeSelectState.props?.value).toMatchObject([{ value: 'createdBy.createdBy.role' }]);
    });

    const tag = treeSelectState.props?.tagRender?.({
      closable: true,
      onClose: vi.fn(),
      value: 'createdBy.createdBy.role',
    });
    const { container } = render(<>{tag}</>);
    expect(container).toHaveTextContent('Created by / Created by / Role');
  });
});
