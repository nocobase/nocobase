import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
interface Loan {
  id: string;
  name: string;
  costCenter: string;
  approvalState: string;
}
interface LoanPage {
  data: Loan[];
  meta: { total: number };
}
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useSettingsData } from './settings/hooks.js';
import { DataTable } from '#components/data-table';
import { Button } from '#components/ui/button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { BackButton } from '#components/back-button';
import { RouteChildPage } from '#components/route-child-page';
// UPGRADE_IMPORTS
export default function Loans() {
  const api = useApiClient(),
    location = useLocation();
  const [params, setParams] = useSearchParams();
  const active = true; // UPGRADE_LOCATION
  const request = useSettingsData<LoanPage>(`loans?${params}`, true); // UPGRADE_REQUEST
  const page = Math.max(1, Number(params.get('page') ?? 1)),
    pageSize = Number(params.get('pageSize') ?? 10);
  const update = (name: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set(name, value);
      if (name !== 'page') next.set('page', '1');
      return next;
    });
  const [resetCount, setResetCount] = useState('121');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const resetSample = async () => {
    setResetting(true);
    setResetError('');
    try {
      await api.request({
        path: 'loans/reset',
        method: 'POST',
        json: { count: Number(resetCount) },
      });
      setSelected([]);
      request.reload();
    } catch {
      setResetError(
        'Reset failed. Your permissions may not allow resetting this sample.',
      );
    } finally {
      setResetting(false);
    }
  };
  const [failed, setFailed] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  // UPGRADE_TABLE
  const rows = request.data?.data ?? [];
  const shown =
    params.get('mode') === 'client'
      ? rows.slice((page - 1) * pageSize, page * pageSize)
      : rows;
  const remove = async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map((id) => api.request({ path: `loans/${id}`, method: 'DELETE' })),
    );
    setFailed(results.filter((r) => r.status === 'rejected').length);
    if (results.some((r) => r.status === 'fulfilled')) request.reload();
  };
  const columns: ColumnDef<Loan>[] = [
    {
      id: 'select',
      header: 'Select',
      cell: ({ row }) => (
        <input
          aria-label={`Select ${row.original.id}`}
          type='checkbox'
          checked={selected.includes(row.original.id)}
          onChange={(e) =>
            setSelected((old) =>
              e.target.checked
                ? [...old, row.original.id]
                : old.filter((id) => id !== row.original.id),
            )
          }
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Equipment loan',
      cell: ({ row }) => (
        <Link to={{ pathname: row.original.id, search: location.search }}>
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'costCenter', header: 'Cost center' },
    { accessorKey: 'approvalState', header: 'Approval' },
    {
      id: 'delete',
      header: 'Actions',
      cell: ({ row }) => (
        <Button onClick={() => void remove([row.original.id])}>
          Delete {row.original.id}
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageContainer>
        <PageHeader
          title='Equipment loans'
          description='Customized lending workflow · LAB-42'
        />
        <p className='font-semibold text-primary'>
          Business customization: cost center and approval policy retained
        </p>
        <div className='flex flex-wrap items-end gap-4'>
          <label>
            Search loans
            <input
              aria-label='Search loans'
              className='block rounded border px-3 py-2'
              value={params.get('q') ?? ''}
              onChange={(e) => update('q', e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              aria-label='Loan status'
              className='block rounded border px-3 py-2'
              value={params.get('status') ?? ''}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value=''>All statuses</option>
              <option value='open'>Open</option>
              <option value='closed'>Closed</option>
            </select>
          </label>
          <label>
            Sort loans
            <select
              aria-label='Sort loans'
              className='block rounded border px-3 py-2'
              value={params.get('order') ?? 'asc'}
              onChange={(e) =>
                setParams((previous) => {
                  const next = new URLSearchParams(previous);
                  next.set('sort', 'name');
                  next.set('order', e.target.value);
                  next.set('page', '1');
                  return next;
                })
              }
            >
              <option value='asc'>Name ascending</option>
              <option value='desc'>Name descending</option>
            </select>
          </label>
          <label>
            Loans per page
            <select
              aria-label='Loans per page'
              className='block rounded border px-3 py-2'
              value={params.get('pageSize') ?? '10'}
              onChange={(e) => update('pageSize', e.target.value)}
            >
              <option value='10'>10</option>
              <option value='20'>20</option>
              <option value='50'>50</option>
              <option value='100'>100</option>
            </select>
          </label>
        </div>
        <div role='tablist' aria-label='Loan views'>
          {['overview', 'active'].map((tab) => (
            <Button
              role='tab'
              aria-selected={(params.get('tab') ?? 'overview') === tab}
              key={tab}
              onClick={() => update('tab', tab)}
            >
              {tab === 'active' ? 'Active loans' : 'Overview'}
            </Button>
          ))}
        </div>
        <div className='flex items-end gap-4'>
          <label>
            Sample records
            <select
              aria-label='Sample records'
              value={resetCount}
              onChange={(event) => setResetCount(event.target.value)}
              className='block rounded border px-3 py-2'
            >
              <option value='121'>121 records — valid source page</option>
              <option value='120'>120 records — last matching page</option>
              <option value='1'>1 record — empty after deletion</option>
            </select>
          </label>
          <Button disabled={resetting} onClick={() => void resetSample()}>
            Reset this sample
          </Button>
          <p role='status'>{resetError}</p>
        </div>
        <p>
          Reset replaces only this sample's synthetic loans. Other samples,
          users and permissions are preserved.
        </p>
        <p data-testid='query'>{location.search}</p>
        <p data-testid='total'>
          Matching total: {request.data?.meta.total ?? 'Loading'}
        </p>
        <p data-testid='failures'>Failed operations: {failed}</p>
        <p data-testid='error'>{request.error ? 'Read failed' : ''}</p>
        <Button onClick={request.reload}>Refresh loans</Button>
        <Button onClick={() => void remove(selected)}>Delete selected</Button>
        <DataTable
          columns={columns}
          data={shown}
          manualPagination
          rowCount={request.data?.meta.total ?? 0}
          paginationState={{ pageIndex: page - 1, pageSize }}
          showSelectedCount={false}
          getRowId={(row) => row.id}
        />
        <output data-testid='ids'>
          {shown.map((row) => row.id).join(',')}
        </output>
      </PageContainer>
      <Outlet context={{ reload: request.reload, remove }} />
    </>
  );
}
export function Detail() {
  const api = useApiClient(),
    location = useLocation(),
    navigate = useNavigate();
  const id = location.pathname.split('/').at(-1);
  const [deleted, setDeleted] = useState(false);
  const { reload } = useOutletContext<{ reload: () => void }>();
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <PageHeader
          title={`Loan ${id}`}
          description='Custom approval details'
        />
        <Button
          onClick={() =>
            void api
              .request({ path: `loans/${id}`, method: 'DELETE' })
              .then(() => {
                reload();
                void navigate({ pathname: '..', search: location.search });
              })
          }
        >
          Delete loan and return
        </Button>
        <Button
          onClick={() =>
            void api
              .request({ path: `loans/${id}`, method: 'DELETE' })
              .then(() => {
                reload();
                setDeleted(true);
              })
          }
        >
          Delete loan and stay
        </Button>
        <p role='status'>{deleted ? 'Loan deletion committed' : ''}</p>
      </PageContainer>
    </RouteChildPage>
  );
}
