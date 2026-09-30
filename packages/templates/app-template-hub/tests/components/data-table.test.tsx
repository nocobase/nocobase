import type { ColumnDef } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';

import enUS from '../../client/locales/en-US.js';
import { DataTable } from '../../client/components/data-table';
import { DataTableColumnHeader } from '../../client/components/data-table-column-header';

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/app-template-hub', resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }) {
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

  it('shows the empty message when there is no data', () => {
    render(<DataTable columns={columns} data={[]} />, { wrapper: I18n });

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });
});
