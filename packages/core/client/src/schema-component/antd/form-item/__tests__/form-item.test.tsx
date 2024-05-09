/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';

describe('FormItem', () => {
  it('should render correctly', async () => {
    render(<App1 />);

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});
