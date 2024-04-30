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

describe('Preview', () => {
  it('should render correctly', () => {
    const { queryAllByText } = render(<App1 />);

    expect(queryAllByText('s33766399').length).toBe(2);
    expect(queryAllByText('简历').length).toBe(2);
  });
});
