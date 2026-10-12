import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DatePicker,
  DateRangePicker,
} from '../../client/components/date-picker';

describe('DatePicker', () => {
  it('shows the placeholder until a date is picked', () => {
    render(<DatePicker id='date' />);

    expect(screen.getByRole('button', { name: 'Pick a date' })).toHaveAttribute(
      'data-empty',
      'true',
    );
  });

  it('formats the selected date on the trigger', () => {
    render(<DatePicker value={new Date(2026, 0, 20)} />);

    expect(
      screen.getByRole('button', { name: 'January 20th, 2026' }),
    ).toHaveAttribute('data-empty', 'false');
  });
});

describe('DateRangePicker', () => {
  it('formats both ends of the range', () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2026, 0, 20), to: new Date(2026, 1, 9) }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Jan 20, 2026 - Feb 09, 2026' }),
    ).toBeInTheDocument();
  });
});
