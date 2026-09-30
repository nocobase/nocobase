import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { DataTable } from '../../registry/components/data-table';
import { DataTableColumnHeader } from '../../registry/components/data-table/column-header';
import { readmeTranslations } from '../readme-translations';

// The keys and wording the components README lists, in a strict runtime: a label looked up under a key the README does
// not list fails the test, rather than rendering its English default.
const translations = readmeTranslations('components');
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/ui-library',
    resources: translations['en-US'],
  },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

interface Payment {
  id: string;
  email: string;
  amount: number;
}

const columns: ColumnDef<Payment, unknown>[] = [
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
  },
  { accessorKey: 'amount', header: 'Amount' },
];

const payments: Payment[] = Array.from({ length: 12 }, (_, index) => ({
  id: String(index),
  email: `user${index}@example.com`,
  amount: index * 10,
}));

describe('DataTable', () => {
  it('renders headers and one page of rows', () => {
    render(<DataTable columns={columns} data={payments} />, { wrapper: I18n });

    expect(screen.getByRole('button', { name: 'Email' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Amount' }),
    ).toBeInTheDocument();
    expect(screen.getByText('user0@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user10@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('renders every row when pagination is off', () => {
    render(<DataTable columns={columns} data={payments} pagination={false} />, {
      wrapper: I18n,
    });

    expect(screen.getByText('user11@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });

  it('shows the selected-row summary unless the page turns it off', () => {
    const { rerender } = render(
      <DataTable columns={columns} data={payments} />,
      { wrapper: I18n },
    );

    expect(screen.getByText('0 of 12 row(s) selected.')).toBeInTheDocument();

    rerender(
      <DataTable columns={columns} data={payments} showSelectedCount={false} />,
    );

    expect(screen.queryByText(/row\(s\) selected/)).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('shows the empty message when there is no data', () => {
    render(<DataTable columns={columns} data={[]} />, { wrapper: I18n });

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });
});
