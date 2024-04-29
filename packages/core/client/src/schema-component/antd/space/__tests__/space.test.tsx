/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { Space } from '../index';

describe('Space', () => {
  it('renders without error', () => {
    const { container } = render(<Space />);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('renders with custom split', () => {
    const { container } = render(<Space split="|" />);
    expect(container).toMatchInlineSnapshot(`<div />`);
  });
});
