/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { AppendsSelect } from '../collection/AppendsSelect';

const treeSelectState = vi.hoisted(() => ({
  props: null as null | Record<string, any>,
}));

vi.mock('antd', () => {
  const TreeSelect = (props: any) => {
    treeSelectState.props = props;
    return <div data-testid="tree-select" />;
  };
  TreeSelect.SHOW_PARENT = 'SHOW_PARENT';
  TreeSelect.SHOW_ALL = 'SHOW_ALL';
  const Tag = ({ children }: any) => <span>{children}</span>;
  return { TreeSelect, Tag };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: (collectionName: string) => ({
              getFields: () =>
                (
                  ({
                    users: [
                      {
                        options: {
                          name: 'createdBy',
                          type: 'belongsTo',
                          target: 'users',
                          interface: 'm2o',
                          uiSchema: { title: '{{t("Created by")}}' },
                        },
                      },
                      {
                        options: {
                          name: 'role',
                          type: 'belongsTo',
                          target: 'roles',
                          interface: 'm2o',
                          uiSchema: { title: '{{t("Role")}}' },
                        },
                      },
                    ],
                    roles: [
                      {
                        options: {
                          name: 'createdBy',
                          type: 'belongsTo',
                          target: 'users',
                          interface: 'm2o',
                          uiSchema: { title: '{{t("Created by")}}' },
                        },
                      },
                    ],
                  }) as Record<string, Array<{ options: Record<string, any> }>>
                )[collectionName] ?? [],
            }),
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
  it('compiles association field titles before passing them to TreeSelect', () => {
    render(<AppendsSelect collection="users" />);

    expect(screen.getByTestId('tree-select')).toBeInTheDocument();
    expect(treeSelectState.props?.treeData).toEqual([
      expect.objectContaining({
        title: 'Created by',
        value: 'createdBy',
      }),
      expect.objectContaining({
        title: 'Role',
        value: 'role',
      }),
    ]);
  });

  it('uses strict tree checking and full-path tag rendering to match v1 appends behavior', () => {
    render(<AppendsSelect collection="users" value={['createdBy.role']} />);

    expect(treeSelectState.props?.treeCheckStrictly).toBe(true);
    expect(treeSelectState.props?.showCheckedStrategy).toBe('SHOW_ALL');
    expect(treeSelectState.props?.value).toMatchObject([{ value: 'createdBy.role', label: 'createdBy.role' }]);

    const tag = treeSelectState.props?.tagRender?.({
      value: 'createdBy.role',
      closable: true,
      onClose: vi.fn(),
    });
    const { container } = render(tag);
    expect(container).toHaveTextContent('Created by / Role');
  });

  it('adds parent paths when a child node is selected', () => {
    const onChange = vi.fn();
    render(<AppendsSelect collection="users" value={[]} onChange={onChange} />);

    treeSelectState.props?.onChange?.([{ value: 'createdBy.role', label: 'createdBy.role' }]);
    expect(onChange).toHaveBeenCalledWith(['createdBy.role', 'createdBy']);
  });

  it('removes descendants when a selected parent node is unselected', () => {
    const onChange = vi.fn();
    render(<AppendsSelect collection="users" value={['createdBy', 'createdBy.role']} onChange={onChange} />);

    treeSelectState.props?.onChange?.([{ value: 'createdBy.role', label: 'createdBy.role' }]);
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

  it('preloads nested value paths so deep selections can be displayed', async () => {
    render(<AppendsSelect collection="users" value={['createdBy.createdBy.role']} />);

    await waitFor(() => {
      expect(treeSelectState.props?.value).toMatchObject([{ value: 'createdBy.createdBy.role' }]);
    });

    const tag = treeSelectState.props?.tagRender?.({
      value: 'createdBy.createdBy.role',
      closable: true,
      onClose: vi.fn(),
    });
    const { container } = render(tag);
    expect(container).toHaveTextContent('Created by / Created by / Role');
  });
});
