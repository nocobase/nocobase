/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import AppBasic from '../demos/component-basic';
import { Tree } from '../component';
import { fireEvent, render, screen } from '@testing-library/react';

describe('TreeComponent', () => {
  test('basic', () => {
    render(<AppBasic />);

    // expect(screen.getByText("0-0")).toBeInTheDocument();
    // expect(screen.getByText("0-0-0")).toBeInTheDocument();
    // expect(screen.getByText("0-0-1")).toBeInTheDocument();
    // expect(screen.getByText("0-0-0-0")).toBeInTheDocument();
    // expect(screen.getByText("0-0-0-1")).toBeInTheDocument();
    // expect(screen.getByText("1-0")).toBeInTheDocument();
    // expect(screen.getByText("2-0")).toBeInTheDocument();

    // expect(screen.getByRole('textbox')).toBeInTheDocument();
    // expect(document.querySelectorAll('.ant-tree-treenode-switcher-open').length).toBe(0);

    // userEvent.type(screen.getByRole('textbox'), '0-0-0-0');
    // expect(document.querySelectorAll('.ant-tree-treenode-switcher-open').length).toBe(2);

    // expect(document.querySelector('.ant-tree-node-selected > span')).toHaveStyle('color: rgb(22, 119, 255);');
  });

  test('keeps custom title rendering when key and title fields are the same', () => {
    render(
      <Tree
        searchable={false}
        fieldNames={{ key: 'id', title: 'id', children: 'children' }}
        treeData={[{ id: 1 }]}
        renderNodeTitle={(value) => <span data-testid="custom-title">#{value}</span>}
      />,
    );

    expect(screen.getByTestId('custom-title')).toHaveTextContent('#1');
  });

  test('keeps manually collapsed state after tree data refreshes', () => {
    const treeData = [
      {
        key: 'parent',
        title: 'Parent',
        children: [{ key: 'child', title: 'Child' }],
      },
    ];
    const { container, rerender } = render(<Tree searchable={false} defaultExpandAll treeData={treeData} />);

    expect(container.querySelector('.ant-tree-treenode-switcher-open')).toBeInTheDocument();

    fireEvent.click(container.querySelector('.ant-tree-switcher'));

    expect(container.querySelector('.ant-tree-treenode-switcher-close')).toBeInTheDocument();

    rerender(
      <Tree
        searchable={false}
        defaultExpandAll
        treeData={[
          {
            key: 'parent',
            title: 'Parent',
            children: [
              { key: 'child', title: 'Child' },
              { key: 'new-child', title: 'New child' },
            ],
          },
        ]}
      />,
    );

    expect(container.querySelector('.ant-tree-treenode-switcher-close')).toBeInTheDocument();
    expect(container.querySelector('.ant-tree-treenode-switcher-open')).not.toBeInTheDocument();
  });
});
