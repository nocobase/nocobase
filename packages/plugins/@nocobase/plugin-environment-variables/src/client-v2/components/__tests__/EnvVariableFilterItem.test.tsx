/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { transformFilter } from '@nocobase/utils/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { EnvVariableFilterItem } from '../EnvVariableFilterItem';

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowEngine: () => ({
      context: {
        t: (key: string) => key,
      },
    }),
  };
});

function openSelect(container: HTMLElement, index: number) {
  const selectors = container.querySelectorAll('.ant-select-selector');
  if (!selectors[index]) {
    throw new Error(`Expected Select trigger at index ${index}`);
  }
  fireEvent.mouseDown(selectors[index]);
}

describe('EnvVariableFilterItem', () => {
  it('uses scalar operators and does not render an empty type tag', async () => {
    const value = observable({ path: '', operator: '', value: '' });
    const { container } = render(<EnvVariableFilterItem value={value} />);

    openSelect(container, 0);
    fireEvent.click(await screen.findByText('Type'));

    await waitFor(() => {
      expect(value.path).toBe('type');
      expect(value.operator).toBe('$eq');
      expect(value.value).toBeUndefined();
    });

    const valueSelect = container.querySelectorAll('.ant-select')[2];
    expect(valueSelect.querySelector('.ant-select-selection-item')).toBeNull();

    openSelect(container, 2);
    fireEvent.click(await screen.findByText('Plain text'));

    await waitFor(() => {
      expect(value.value).toEqual(['default']);
    });
    expect(valueSelect).toHaveTextContent('Plain text');
    expect(transformFilter({ logic: '$and', items: [value] })).toEqual({
      $and: [{ type: { $eq: ['default'] } }],
    });
  });

  it('uses $ne for the type is-not operator without changing the selected values', async () => {
    const value = observable({ path: 'type', operator: '$eq', value: ['secret'] });
    const { container } = render(<EnvVariableFilterItem value={value} />);

    openSelect(container, 1);
    fireEvent.click(await screen.findByText('is not'));

    await waitFor(() => {
      expect(value.operator).toBe('$ne');
      expect(value.value).toEqual(['secret']);
    });
    expect(transformFilter({ logic: '$and', items: [value] })).toEqual({
      $and: [{ type: { $ne: ['secret'] } }],
    });
  });
});
