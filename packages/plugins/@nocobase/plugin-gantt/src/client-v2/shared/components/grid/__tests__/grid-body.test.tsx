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
import { describe, expect, test } from 'vitest';
import type { Task } from '../../../../shared/types/public-types';
import { GridBody } from '../grid-body';

const createTask = (id: string): Task => ({
  id,
  type: 'task',
  name: `Task ${id}`,
  start: new Date('2026-05-25T00:00:00'),
  end: new Date('2026-05-26T00:00:00'),
  progress: 0,
});

describe('GridBody', () => {
  test('renders horizontal dividers, vertical zebra stripes, and selected row highlights', () => {
    const { container } = render(
      <svg>
        <GridBody
          tasks={[createTask('1'), createTask('2')]}
          dates={[new Date('2026-05-25T00:00:00'), new Date('2026-05-26T00:00:00'), new Date('2026-05-27T00:00:00')]}
          svgWidth={180}
          rowHeight={40}
          columnWidth={60}
          todayColor="rgba(0, 0, 0, 0.08)"
          rtl={false}
          selectedRowKeys={['2']}
        />
      </svg>,
    );

    expect(container.querySelectorAll('g.background rect')).toHaveLength(1);
    expect(container.querySelectorAll('g.columns rect')).toHaveLength(1);
    expect(container.querySelectorAll('g.rows rect')).toHaveLength(1);
    expect(container.querySelectorAll('g.rowLines line')).toHaveLength(3);
    expect(container.querySelectorAll('g.ticks line')).toHaveLength(0);

    const selectedRow = container.querySelector('g.rows rect');
    expect(selectedRow).not.toBeNull();
    expect(selectedRow?.getAttribute('y')).toBe('40');
  });
});
