/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent } from '@nocobase/test/client';
import React from 'react';
import Cron from '../demos/demo1';
import CronSet from '../demos/demo2';

describe('Cron', () => {
  it('should render correctly', () => {
    render(<Cron />);

    // title
    expect(screen.getByText('Cron')).toBeInTheDocument();

    expect(screen.getByText('Every')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('at')).toBeInTheDocument();
    expect(screen.getByText('every hour')).toBeInTheDocument();
    expect(screen.getByText('every minute')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});

describe('CronSet', () => {
  it('should render correctly', async () => {
    render(<CronSet />);

    // title
    expect(screen.getByText('CronSet')).toBeInTheDocument();

    const selector = document.querySelector('.ant-select-selector');
    expect(selector).toBeInTheDocument();

    await userEvent.click(selector);
    await userEvent.click(screen.getByText('Custom'));

    expect(screen.getByText('Every')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});
