/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AIEmployeeDropdown } from '../AIEmployeeDropdown';
import type { AIEmployee } from '../types';

vi.mock('../../locale', () => ({ useT: () => (text: string) => text }));
vi.mock('../ProfileCard', () => ({ AIEmployeeProfileCard: () => null }));
vi.mock('../avatars', () => ({ avatars: () => undefined }));

const employee: AIEmployee = {
  username: 'atlas',
  nickname: 'Atlas',
  category: 'business',
  position: 'Assistant',
  avatar: 'atlas',
};

describe('AI employee touch selection', () => {
  it('opens by click without requiring hover and selects an employee', async () => {
    const onSelect = vi.fn();
    const { getByRole, findByRole } = render(<AIEmployeeDropdown aiEmployees={[employee]} onSelect={onSelect} />);
    const trigger = getByRole('button', { name: 'AI employee' });
    expect(trigger.tagName).toBe('BUTTON');
    fireEvent.click(trigger);
    fireEvent.click(await findByRole('menuitem'));
    expect(onSelect).toHaveBeenCalledWith(employee);
  });

  it('does not open a disabled selector', () => {
    const { getByRole, queryByRole } = render(
      <AIEmployeeDropdown aiEmployees={[employee]} disabled onSelect={vi.fn()} />,
    );
    const trigger = getByRole('button', { name: 'AI employee' }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(queryByRole('menu')).toBeNull();
  });
});
