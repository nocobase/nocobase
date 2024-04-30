/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { PasswordStrength } from '../PasswordStrength';

describe('PasswordStrength', () => {
  it('renders children with strength value', () => {
    const strengthValue = 20;
    const childrenMock = vitest.fn().mockReturnValue(<div>Strength: {strengthValue}</div>);
    const { getByText } = render(<PasswordStrength value="password">{childrenMock}</PasswordStrength>);
    expect(childrenMock).toHaveBeenCalledWith(strengthValue);
    expect(getByText(`Strength: ${strengthValue}`)).toBeInTheDocument();
  });

  it('renders children without strength value', () => {
    const childrenMock = vitest.fn().mockReturnValue(<div>No strength value</div>);
    const { getByText } = render(<PasswordStrength>{childrenMock}</PasswordStrength>);
    expect(childrenMock).toHaveBeenCalledWith(0);
    expect(getByText('No strength value')).toBeInTheDocument();
  });

  it('renders children without function', () => {
    const childrenMock = <div>Children without function</div>;
    const { getByText } = render(<PasswordStrength>{childrenMock}</PasswordStrength>);
    expect(getByText('Children without function')).toBeInTheDocument();
  });
});
