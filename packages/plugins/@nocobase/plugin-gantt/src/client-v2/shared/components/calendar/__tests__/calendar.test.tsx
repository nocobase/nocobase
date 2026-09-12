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
import type { DateSetup } from '../../../types/date-setup';
import { ViewMode } from '../../../types/public-types';
import { Calendar } from '../calendar';

const baseProps = {
  locale: 'en-US',
  rtl: false,
  headerHeight: 40,
  columnWidth: 40,
  fontFamily: 'Arial',
  fontSize: '12px',
};

const renderBottomTextPositions = (dateSetup: DateSetup, expectedCount: number) => {
  const { container } = render(
    <svg>
      <Calendar {...baseProps} viewMode={dateSetup.viewMode} dateSetup={dateSetup} />
    </svg>,
  );

  return Array.from(container.querySelectorAll('text'))
    .slice(0, expectedCount)
    .map((node) => node.getAttribute('x'));
};

describe('Calendar', () => {
  test.each([
    {
      mode: ViewMode.Week,
      dates: [new Date('2026-05-25T00:00:00'), new Date('2026-06-01T00:00:00')],
      expected: ['60', '20'],
    },
    {
      mode: ViewMode.HalfDay,
      dates: [new Date('2026-05-25T00:00:00'), new Date('2026-05-25T12:00:00')],
      expected: ['20', '60'],
    },
    {
      mode: ViewMode.Hour,
      dates: [new Date('2026-05-25T00:00:00'), new Date('2026-05-25T01:00:00')],
      expected: ['20', '60'],
    },
  ])('centers bottom labels in $mode mode', ({ mode, dates, expected }) => {
    const positions = renderBottomTextPositions({ viewMode: mode, dates }, dates.length);

    expect(positions).toEqual(expected);
  });
});
