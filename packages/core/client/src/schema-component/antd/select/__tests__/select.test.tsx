/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Select', () => {
  it('select one', async () => {
    const { container } = render(<App1 />);
    const selector = container.querySelector('.ant-select-selector') as HTMLElement;
    await userEvent.click(selector);
    expect(screen.getByText('福建')).toBeInTheDocument();
    expect(screen.getByText('江苏')).toBeInTheDocument();
    expect(screen.getByText('浙江')).toBeInTheDocument();
    expect(screen.getByText('福州')).toBeInTheDocument();
    expect(screen.getByText('莆田')).toBeInTheDocument();

    await userEvent.click(screen.getByText('福州'));
    expect(container.querySelectorAll('.ant-tag')).toHaveLength(1);
    expect(container.querySelector('.ant-tag')).toHaveTextContent('福州');
  });

  it('select multiple', async () => {
    const { container } = render(<App2 />);
    const selector = container.querySelector('.ant-select-selector') as HTMLElement;
    await userEvent.click(selector);
    await userEvent.click(screen.getByText('福州'));
    await userEvent.click(selector);
    fireEvent.click(screen.getByText('浙江'));
    expect(screen.getAllByText('福州')).toHaveLength(2);
    expect(screen.getAllByText('浙江')).toHaveLength(2);
  });

  it('select one & objectValue: true', async () => {
    const { container } = render(<App3 />);
    const selector = container.querySelector('.ant-select-selector') as HTMLElement;

    // default value
    expect(container.querySelectorAll('.ant-tag')).toHaveLength(1);
    expect(container.querySelector('.ant-tag')).toHaveTextContent('福州');

    await userEvent.click(selector);
    await userEvent.click(screen.getByText('莆田'));
    expect(container.querySelectorAll('.ant-tag')).toHaveLength(1);
    expect(container.querySelector('.ant-tag')).toHaveTextContent('莆田');
  });
});
