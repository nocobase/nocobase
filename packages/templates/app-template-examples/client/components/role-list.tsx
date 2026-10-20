import { useMemo, type ReactElement } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Link, type To } from 'react-router';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Badge } from '#components/ui/badge';

export interface RoleListRole {
  readonly key: string;
  readonly title: string;
  readonly to: To;
  readonly protected: boolean;
}

export interface RoleListProps {
  readonly roles: readonly RoleListRole[];
  readonly labels: {
    readonly name: string;
    readonly key: string;
    readonly type: string;
    readonly protected: string;
    readonly custom: string;
  };
  readonly ariaLabel?: string;
}

/** Standard role table; the host owns authorization, loading and filtering. */
export function RoleList({
  roles,
  labels,
  ariaLabel,
}: RoleListProps): ReactElement {
  const columns = useMemo<ColumnDef<RoleListRole>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.name} />
        ),
        cell: ({ row }) => (
          <Link
            to={row.original.to}
            className='inline-block max-w-72 truncate align-middle font-medium text-foreground'
            title={row.original.title}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'key',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={labels.key} />
        ),
        cell: ({ row }) => (
          <span
            className='inline-block max-w-64 truncate align-middle text-muted-foreground'
            title={row.original.key}
          >
            {row.original.key}
          </span>
        ),
      },
      {
        accessorKey: 'protected',
        header: labels.type,
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {row.original.protected ? labels.protected : labels.custom}
          </Badge>
        ),
      },
    ],
    [labels],
  );
  return (
    <div role='region' aria-label={ariaLabel}>
      <DataTable
        columns={columns}
        data={roles}
        getRowId={(role) => role.key}
        showSelectedCount={false}
      />
    </div>
  );
}
