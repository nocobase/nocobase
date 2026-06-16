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
import { render, screen } from '@testing-library/react';
import { AppendsSelect } from '../AppendsSelect';

const treeSelectState = vi.hoisted(() => ({
  props: null as null | { treeData?: Array<{ title: string; value: string }> },
}));

vi.mock('antd', () => {
  const TreeSelect = (props: any) => {
    treeSelectState.props = props;
    return <div data-testid="tree-select" />;
  };
  TreeSelect.SHOW_PARENT = 'SHOW_PARENT';
  return { TreeSelect };
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: () => ({
              getFields: () => [
                {
                  options: {
                    name: 'createdBy',
                    type: 'belongsTo',
                    target: 'users',
                    uiSchema: { title: '{{t("Created by")}}' },
                  },
                },
              ],
            }),
          },
        }),
      },
    },
  }),
}));

vi.mock('../../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\("(.+)"(?:,\s*\{.*\})?\)}}$/);
    return matched?.[1] ?? key;
  },
}));

describe('Schedule AppendsSelect', () => {
  it('compiles association field titles before passing them to TreeSelect', () => {
    render(<AppendsSelect collection="users" />);

    expect(screen.getByTestId('tree-select')).toBeInTheDocument();
    expect(treeSelectState.props?.treeData).toEqual([
      expect.objectContaining({
        title: 'Created by',
        value: 'createdBy',
      }),
    ]);
  });
});
