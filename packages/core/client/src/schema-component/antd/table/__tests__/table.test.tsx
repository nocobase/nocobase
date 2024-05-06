/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';
import App4 from '../demos/demo4';

describe('Table', () => {
  it('Table.Array', () => {
    const { container } = render(<App1 />);
  });

  it('Table.Void', () => {
    const { container } = render(<App2 />);
  });

  it('Table.RowSelection', () => {
    const { container } = render(<App3 />);
  });

  it('With Actions', () => {
    const { container } = render(<App4 />);
  });
});
