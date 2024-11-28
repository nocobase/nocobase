/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

// jsdom does not support canvas, so we need to skip this test
describe.skip('G2Plot', () => {
  it('basic', async () => {
    render(<App1 />);

    await waitFor(() => {
      const g2plot = document.querySelector('.g2plot') as HTMLDivElement;
      expect(g2plot).toBeInTheDocument();
    });
  });
});
