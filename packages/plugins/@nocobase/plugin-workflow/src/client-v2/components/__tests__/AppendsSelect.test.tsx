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
import { render, screen, waitFor } from '@testing-library/react';
import { AppendsSelect } from '../collection/AppendsSelect';

type TreeSelectNodeSnapshot = {
  fullTitle?: string[];
  key: string;
  loadChildren?: (option: TreeSelectNodeSnapshot) => TreeSelectNodeSnapshot[];
  title: string;
  value: string;
};

type TreeSelectPropsSnapshot = {
  loadData?: (option: TreeSelectNodeSnapshot) => void | Promise<void>;
  onChange?: (value: Array<{ value?: string }>) => void;
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
            getCollection: (name: string) => {
              const fields: Record<string, Array<Record<string, unknown>>> = {
                users: [
                  {
                    name: 'roles',
                    type: 'belongsToMany',
                    interface: 'm2m',
                    target: 'roles',
                    uiSchema: { title: '{{t("Roles")}}' },
                  },
                ],
                roles: [],
                root: [
                  {
                    name: 'createdBy',
                    type: 'belongsTo',
                    interface: 'm2o',
                    target: 'users',
                    uiSchema: { title: '{{t("Created by")}}' },
                  },
                  {
                    name: 'profile',
                    type: 'hasOne',
                    interface: 'oho',
                    target: 'profiles',
                    uiSchema: { title: '{{t("Profile")}}' },
                  },
                ],
                profiles: [],
              };
              return {
                getFields: () => fields[name] ?? [],
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

  it('stores selected child associations together with their parent paths', () => {
    const onChange = vi.fn();

    render(<AppendsSelect collection="root" value={[]} onChange={onChange} />);

    treeSelectState.props?.onChange?.([{ value: 'createdBy.roles' }]);

    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['createdBy', 'createdBy.roles']));
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
});
