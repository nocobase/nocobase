import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DatePicker,
  DateRangePicker,
} from '../../registry/components/date-picker';
import { readmeTranslations } from '../readme-translations';

// Strict, with the keys the components README lists, as in data-table.test.tsx.
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/ui-library',
    resources: readmeTranslations('components')['en-US'],
  },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

describe('DatePicker', () => {
  it('shows the placeholder until a date is picked', () => {
    render(<DatePicker id='date' />, { wrapper: I18n });

    expect(screen.getByRole('button', { name: 'Pick a date' })).toHaveAttribute(
      'data-empty',
      'true',
    );
  });

  it('formats the selected date on the trigger', () => {
    render(<DatePicker value={new Date(2026, 0, 20)} />, { wrapper: I18n });

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
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('button', { name: 'Jan 20, 2026 - Feb 09, 2026' }),
    ).toBeInTheDocument();
  });
});
