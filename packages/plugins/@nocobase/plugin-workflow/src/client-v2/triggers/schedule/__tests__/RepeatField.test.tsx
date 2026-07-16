/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  cronProps: null as any,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({}),
}));

vi.mock('../../../locale', () => ({
  useWorkflowTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-js-cron', () => ({
  Cron: (props: any) => {
    holder.cronProps = props;
    return <div data-testid="react-js-cron" />;
  },
}));

import { RepeatField } from '../RepeatField';

describe('RepeatField', () => {
  it('passes window.cronLocale through to react-js-cron', () => {
    window.cronLocale = {
      everyText: '每',
      emptyMonths: '每月',
    } as any;

    render(<RepeatField value="0 * * * * *" onChange={() => undefined} />);

    expect(screen.getByTestId('react-js-cron')).toBeInTheDocument();
    expect(holder.cronProps?.locale).toEqual({
      everyText: '每',
      emptyMonths: '每月',
    });
  });
});
