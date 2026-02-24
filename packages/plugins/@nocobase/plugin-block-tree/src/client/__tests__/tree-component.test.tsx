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
import { render, screen } from '@testing-library/react';
import { userEvent } from '@nocobase/test/client';

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
  })
});

