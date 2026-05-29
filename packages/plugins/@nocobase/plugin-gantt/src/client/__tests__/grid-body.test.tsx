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
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Task } from '../types/public-types';
import { GridBody } from '../components/grid/grid-body';

const { nextUid, resetUidCounter } = vi.hoisted(() => {
  let uidCounter = 0;
  return {
    nextUid: () => `mock-empty-row-id-${uidCounter++}`,
    resetUidCounter: () => {
      uidCounter = 0;
    },
  };
});

vi.mock('@nocobase/utils/client', () => ({
  uid: nextUid,
}));

const createTask = (id: string): Task => ({
  id,
  type: 'task',
  name: `Task ${id}`,
  start: new Date('2026-05-25T00:00:00'),
  end: new Date('2026-05-26T00:00:00'),
  progress: 0,
});

describe('GridBody', () => {
  beforeEach(() => {
    resetUidCounter();
  });

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
    expect(container.querySelectorAll('g.ticks line')).toHaveLength(3);

    const selectedRow = container.querySelector('g.rows rect');
    expect(selectedRow).not.toBeNull();
    expect(selectedRow?.getAttribute('y')).toBe('40');
  });

  test('keeps placeholder rows when the gantt has no tasks', () => {
    const { container } = render(
      <svg>
        <GridBody
          tasks={[]}
          dates={[new Date('2026-05-25T00:00:00'), new Date('2026-05-26T00:00:00')]}
          svgWidth={120}
          rowHeight={40}
          columnWidth={60}
          todayColor="rgba(0, 0, 0, 0.08)"
          rtl={false}
          selectedRowKeys={[]}
        />
      </svg>,
    );

    const background = container.querySelector('g.background rect');
    expect(background?.getAttribute('height')).toBe('120');
    expect(container.querySelectorAll('g.rowLines line')).toHaveLength(4);
  });
});
