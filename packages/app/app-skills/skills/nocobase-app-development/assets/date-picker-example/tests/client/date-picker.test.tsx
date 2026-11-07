import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DatePicker } from '#components/date-picker';
import { formatDateOnly, parseDateOnly } from '#lib/date-only';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

async function view(
  ui: ReactElement,
  locale: 'en-US' | 'zh-CN' = 'en-US',
): Promise<(next: ReactElement) => void> {
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace: '@nocobase/app-template-examples',
      resources: locale === 'en-US' ? enUS : zhCN,
    },
  });
  const { rerender } = render(
    <TestI18nProvider runtime={runtime}>{ui}</TestI18nProvider>,
  );
  return (next) =>
    rerender(<TestI18nProvider runtime={runtime}>{next}</TestI18nProvider>);
}

/** A form field the way a business page wires it: a label, and a `'yyyy-MM-dd'` value at the boundary. */
function HolidayField({
  initial = '',
  disabled = false,
  onChange = () => {},
}: {
  readonly initial?: string;
  readonly disabled?: boolean;
  readonly onChange?: (value: string) => void;
}): ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor='holiday'>Holiday</label>
      <DatePicker
        id='holiday'
        clearable
        disabled={disabled}
        value={parseDateOnly(value)}
        onChange={(date) => {
          setValue(formatDateOnly(date));
          onChange(formatDateOnly(date));
        }}
      />
    </>
  );
}

describe('DatePicker', () => {
  it('shows a loaded date, picks another from the calendar and returns focus to its labelled trigger', async () => {
    const changes = vi.fn();
    await view(<HolidayField initial='2026-01-01' onChange={changes} />);
    const trigger = screen.getByRole('button', { name: /Holiday/ });
    expect(trigger).toBe(screen.getByLabelText('Holiday'));
    expect(trigger).toHaveTextContent('January 1st, 2026');

    await userEvent.click(trigger);
    const day = await screen.findByRole('button', {
      name: /Friday, January 2nd, 2026/,
    });
    await userEvent.click(day);

    expect(changes).toHaveBeenLastCalledWith('2026-01-02');
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
    expect(trigger).toHaveTextContent('January 2nd, 2026');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('is operable from the keyboard', async () => {
    const changes = vi.fn();
    await view(<HolidayField initial='2026-01-01' onChange={changes} />);
    screen.getByRole('button', { name: /Holiday/ }).focus();
    await userEvent.keyboard('{Enter}');
    // The calendar focuses the selected day; the arrow keys move between days.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /January 1st, 2026/ }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowRight}');
    expect(
      screen.getByRole('button', { name: /January 2nd, 2026/ }),
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(changes).toHaveBeenLastCalledWith('2026-01-02');
  });

  it('clears the date and shows the placeholder', async () => {
    const changes = vi.fn();
    await view(<HolidayField initial='2026-01-01' onChange={changes} />);
    await userEvent.click(screen.getByRole('button', { name: /Holiday/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Clear' }));
    expect(changes).toHaveBeenLastCalledWith('');
    expect(screen.getByLabelText('Holiday')).toHaveTextContent('Pick a date');
    // Nothing is left to clear.
    await userEvent.click(screen.getByRole('button', { name: /Holiday/ }));
    await screen.findByRole('grid');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('does not open while disabled', async () => {
    await view(<HolidayField initial='2026-01-01' disabled />);
    const trigger = screen.getByLabelText('Holiday');
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('closes and ignores the calendar when it becomes disabled while open', async () => {
    const changes = vi.fn();
    const rerender = await view(
      <HolidayField initial='2026-01-01' onChange={changes} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Holiday/ }));
    const day = await screen.findByRole('button', {
      name: /January 2nd, 2026/,
    });
    const clear = screen.getByRole('button', { name: 'Clear' });

    rerender(<HolidayField initial='2026-01-01' onChange={changes} disabled />);
    expect(screen.getByLabelText('Holiday')).toBeDisabled();
    // Whatever is still on screen while the popover closes, neither picking a day nor clearing changes the value.
    for (const control of [day, clear]) {
      if (control.isConnected) control.click();
    }
    await waitFor(() => expect(screen.queryByRole('grid')).toBeNull());
    expect(changes).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Holiday')).toHaveTextContent(
      'January 1st, 2026',
    );

    // Enabling the field again does not reopen the calendar on its own.
    rerender(<HolidayField initial='2026-01-01' onChange={changes} />);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('formats the trigger and the calendar in the interface language', async () => {
    await view(<HolidayField initial='2026-01-01' />, 'zh-CN');
    const trigger = screen.getByLabelText('Holiday');
    expect(trigger).toHaveTextContent('2026年1月1日');
    await userEvent.click(trigger);
    expect(await screen.findByRole('grid')).toHaveAccessibleName(
      /2026年1月|一月 2026/,
    );
    await userEvent.click(screen.getByRole('button', { name: '清除' }));
    expect(trigger).toHaveTextContent(zhCN.datePicker.placeholder);
  });
});

describe('calendar date values', () => {
  const zone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = zone;
  });

  it.each(['America/Los_Angeles', 'Asia/Shanghai', 'Pacific/Kiritimati'])(
    'keep the same day in %s',
    (timeZone) => {
      process.env.TZ = timeZone;
      const date = parseDateOnly('2026-01-02');
      expect(date?.getDate()).toBe(2);
      expect(formatDateOnly(date)).toBe('2026-01-02');
      expect(formatDateOnly(new Date(2026, 11, 31))).toBe('2026-12-31');
    },
  );

  it('reads an empty or invalid value as no date', () => {
    expect(parseDateOnly('')).toBeUndefined();
    expect(parseDateOnly('2026-02-30')).toBeUndefined();
    expect(formatDateOnly(undefined)).toBe('');
  });
});
