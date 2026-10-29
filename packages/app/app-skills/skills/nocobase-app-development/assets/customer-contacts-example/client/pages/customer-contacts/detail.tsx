import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import { RouteChildPage } from '#components/route-child-page';
import { BackButton } from '#components/back-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { LongText } from '#components/long-text';
import { DataTable } from '#components/data-table';
import { RecordLink } from '#components/record-link';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { useListData } from '#hooks/use-list-data';
import { useListLocation } from '#hooks/use-list-location';
import { ReadFeedback, WriteFeedback } from './shared.js';
import {
  base,
  useCrmAction,
  useWriteLock,
  type Customer,
  type Contact,
  type List,
} from './model.js';
import { OwnerName, type CustomerListContext } from './index.js';

export interface CustomerDetailContext {
  customer: Customer | undefined;
  reload: () => void;
  onCustomerSaved: (row: Customer) => void;
}
export default function CustomerDetailPage() {
  const { customerId = '' } = useParams();
  const parent = useOutletContext<CustomerListContext>();
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const location = useLocation();
  const { active } = useListLocation();
  const request = useListData<{ data: Customer }>(
    `${base}/customers/${encodeURIComponent(customerId)}`,
    { active },
  );
  const [page, setPage] = useState(0);
  const contacts = useListData<List<Contact>>(
    `${base}/customers/${encodeURIComponent(customerId)}/contacts?page=${page + 1}&pageSize=10`,
    { active },
  );
  const edit = useCrmAction('customers', 'edit');
  const assign = useCrmAction('customers', 'assign');
  const maintain = useCrmAction('contacts', 'edit');
  const [deleting, setDeleting] = useState<Contact>();
  const [error, setError] = useState<unknown>();
  const lock = useWriteLock();
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && !request.loading && document.activeElement === document.body)
      headingRef.current?.focus();
  }, [active, request.loading]);
  const customer = request.data?.data;
  const writable = customer && customer.status !== 'closed';
  const reload = () => {
    request.reload();
    contacts.reload();
    parent.reload();
  };
  const context: CustomerDetailContext = {
    customer,
    reload,
    onCustomerSaved: (row) => {
      request.replaceData({ data: row });
      parent.onSaved(row);
      parent.reload();
    },
  };
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: t('customerContacts.name'),
      cell: ({ row }) =>
        maintain.can && writable ? (
          <RecordLink
            to={{
              pathname: `contacts/${row.original.id}/edit`,
              search: location.search,
            }}
          >
            {row.original.name}
          </RecordLink>
        ) : (
          row.original.name
        ),
    },
    { accessorKey: 'email', header: t('customerContacts.email') },
    {
      accessorKey: 'phone',
      header: t('customerContacts.phone'),
      cell: ({ row }) => row.original.phone || '—',
    },
    { accessorKey: 'title', header: t('customerContacts.jobTitle') },
    ...(maintain.can && writable
      ? [
          {
            id: 'actions',
            header: t('customerContacts.actions'),
            cell: ({ row }: { row: { original: Contact } }) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('customerContacts.actionsFor', {
                        name: row.original.name,
                      })}
                    />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-auto min-w-40'>
                  <DropdownMenuItem
                    render={
                      <Link
                        to={{
                          pathname: `contacts/${row.original.id}/edit`,
                          search: location.search,
                        }}
                      />
                    }
                  >
                    {t('customerContacts.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => {
                      void (async () => {
                        if (!lock.acquire()) return;
                        try {
                          const fresh = await api.request<{ data: Contact }>({
                            path: `${base}/contacts/${encodeURIComponent(row.original.id)}`,
                          });
                          setDeleting(fresh.data);
                        } catch (failure) {
                          setError(failure);
                        } finally {
                          lock.release();
                        }
                      })();
                    }}
                  >
                    {t('customerContacts.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ];
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <div ref={headingRef} tabIndex={-1}>
          <PageHeader
            title={customer?.name ?? t('customerContacts.customer')}
            actions={
              customer && (
                <>
                  {(edit.can || assign.can) && writable && (
                    <Button
                      render={
                        <Link
                          to={{ pathname: 'edit', search: location.search }}
                        />
                      }
                      nativeButton={false}
                    >
                      {t('customerContacts.edit')}
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    disabled={request.loading}
                    onClick={reload}
                  >
                    <RefreshCw />
                    {t('customerContacts.refresh')}
                  </Button>
                </>
              )
            }
          />
        </div>
        {(request.loading && !customer) || request.error ? (
          <ReadFeedback error={request.error} retry={request.reload} />
        ) : (
          customer && (
            <>
              <dl className='grid grid-cols-[8rem_1fr] gap-4 text-sm'>
                <dt className='text-muted-foreground'>
                  {t('customerContacts.status')}
                </dt>
                <dd>
                  <StatusBadge>
                    {t(`customerContacts.${customer.status}`)}
                  </StatusBadge>
                </dd>
                <dt className='text-muted-foreground'>
                  {t('customerContacts.owner')}
                </dt>
                <dd>
                  <OwnerName id={customer.ownerId} />
                </dd>
                <dt className='text-muted-foreground'>
                  {t('customerContacts.notes')}
                </dt>
                <dd className='min-w-0 whitespace-pre-wrap break-words'>
                  <LongText>{customer.notes || '—'}</LongText>
                </dd>
              </dl>
              {!writable && (
                <p className='text-sm text-muted-foreground'>
                  {t('customerContacts.readOnly')}
                </p>
              )}
              <div className='flex items-center justify-between gap-2'>
                <h2 className='text-base font-medium'>
                  {t('customerContacts.contacts')}
                </h2>
                {maintain.can && writable && (
                  <Button
                    variant='outline'
                    render={
                      <Link
                        to={{
                          pathname: 'contacts/new',
                          search: location.search,
                        }}
                      />
                    }
                    nativeButton={false}
                  >
                    {t('customerContacts.newContact')}
                  </Button>
                )}
              </div>
              {contacts.error ? (
                <ReadFeedback error={contacts.error} retry={contacts.reload} />
              ) : (
                <DataTable
                  columns={columns}
                  data={contacts.data?.data ?? []}
                  manualPagination
                  rowCount={contacts.data?.meta.total ?? 0}
                  paginationState={{ pageIndex: page, pageSize: 10 }}
                  onPaginationChange={(update) =>
                    setPage(
                      (old) =>
                        (typeof update === 'function'
                          ? update({ pageIndex: old, pageSize: 10 })
                          : update
                        ).pageIndex,
                    )
                  }
                  pageSizeOptions={[10]}
                  showSelectedCount={false}
                  loading={contacts.loading}
                />
              )}
            </>
          )
        )}
        {!deleting && <WriteFeedback error={error} />}
        <AlertDialog
          open={Boolean(deleting)}
          onOpenChange={(open) => {
            if (!open && !lock.locked()) setDeleting(undefined);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('customerContacts.deleteTitle', { name: deleting?.name })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('customerContacts.deleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <WriteFeedback error={error} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={lock.busy}>
                {t('customerContacts.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={lock.busy}
                onClick={(e) => {
                  void (async () => {
                    e.preventDefault();
                    if (!deleting || !lock.acquire()) return;
                    try {
                      await api.request({
                        path: `${base}/contacts/${encodeURIComponent(deleting.id)}`,
                        method: 'DELETE',
                      });
                      toaster.show({
                        type: 'success',
                        title: t('customerContacts.deleted', {
                          name: deleting.name,
                        }),
                      });
                      setDeleting(undefined);
                      reload();
                      headingRef.current?.focus();
                    } catch (failure) {
                      setError(failure);
                    } finally {
                      lock.release();
                    }
                  })();
                }}
              >
                {lock.busy
                  ? t('customerContacts.saving')
                  : t('customerContacts.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Outlet context={context} />
      </PageContainer>
    </RouteChildPage>
  );
}
