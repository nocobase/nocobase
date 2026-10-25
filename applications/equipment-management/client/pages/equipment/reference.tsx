import { focusInvalid } from './validation.js';
import { useState, type FormEvent } from 'react';
import {
  Link,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Button } from '#components/ui/button';
import { RouteDialog } from '#components/route-dialog';
import { DataTable } from '#components/data-table';
import { toast } from '#components/ui/toast';
import { useReferences, useEquipmentWrite, type Row } from './api.js';
import { useFormGuard } from './form-guard.js';
import { FormFields, ErrorNotice, LoadState } from './shared.js';
const kinds = [
  'equipmentCategories',
  'equipmentDepartments',
  'equipmentLocations',
];
export default function ReferenceData() {
  const { t } = useTranslation();
  const refs = useReferences();
  const location = useLocation();
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('equipment.referenceData')}
          description={t('equipment.description')}
          actions={
            <Button
              variant='outline'
              disabled={refs.isFetching}
              onClick={() => void refs.refetch()}
            >
              {t('equipment.refresh')}
            </Button>
          }
        />
        <LoadState
          loading={refs.isPending}
          error={refs.error}
          retry={() => void refs.refetch()}
        />
        <div className='grid items-start gap-4 xl:grid-cols-3'>
          {kinds.map((kind) => (
            <Card key={kind}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between gap-2'>
                  {t('equipment.reference.' + kind)}
                  <Button
                    size='sm'
                    variant='outline'
                    nativeButton={false}
                    render={
                      <Link
                        to={{
                          pathname: kind + '/new',
                          search: location.search,
                        }}
                      />
                    }
                  >
                    +
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  pagination={false}
                  data={refs.data?.data[kind] || []}
                  columns={[
                    {
                      accessorKey: 'name',
                      header: t('equipment.fields.name'),
                      cell: ({ row }) => (
                        <Link
                          className='text-primary hover:underline'
                          to={{
                            pathname: kind + '/' + row.original.id,
                            search: location.search,
                          }}
                        >
                          {row.original.name}
                        </Link>
                      ),
                    },
                    { accessorKey: 'code', header: t('equipment.fields.code') },
                  ]}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
      <Outlet />
    </>
  );
}
export function ReferenceForm() {
  const { kind = '', refId = '' } = useParams();
  const refs = useReferences();
  const row = refs.data?.data[kind]?.find((r) => r.id === refId);
  if (refs.isPending) return <LoadState loading />;
  return <Editor key={kind + refId} row={row} kind={kind} />;
}
function Editor({ row, kind }: { row?: Row; kind: string }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    name: String(row?.name || ''),
    code: String(row?.code || ''),
  });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<unknown>();
  const write = useEquipmentWrite();
  const navigate = useNavigate();
  const location = useLocation();
  const guard = useFormGuard(dirty, busy);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await write(
        'reference/' + kind + (row ? '/' + row.id : ''),
        deleting ? undefined : values,
        deleting ? 'DELETE' : row ? 'PATCH' : 'POST',
      );
      guard.allowLeave();
      toast.add({
        title: t('equipment.saved', { name: values.name }),
        type: 'success',
      });
      await navigate(
        { pathname: '..', search: location.search },
        { relative: 'route', replace: true },
      );
    } catch (err) {
      setError(err);
      focusInvalid(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RouteDialog
      title={t('equipment.confirmTitle', {
        action: t(
          'equipment.' + (deleting ? 'delete' : row ? 'edit' : 'createAction'),
        ),
        name: row?.name || t('equipment.reference.' + kind),
      })}
      description={deleting ? t('equipment.deleteWarning') : undefined}
      closeTo={{ pathname: '..', search: location.search }}
      beforeClose={guard.beforeClose}
      footer={
        <>
          {row && !deleting && (
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => setDeleting(true)}
            >
              {t('equipment.delete')}
            </Button>
          )}
          <Button
            variant='outline'
            disabled={busy}
            onClick={() =>
              void navigate(
                { pathname: '..', search: location.search },
                { relative: 'route' },
              )
            }
          >
            {t('equipment.cancel')}
          </Button>
          <Button
            type='submit'
            form='equipment-reference-form'
            variant={deleting ? 'destructive' : 'default'}
            disabled={busy}
          >
            {t('equipment.' + (deleting ? 'confirm' : 'save'))}
          </Button>
        </>
      }
    >
      <form
        id='equipment-reference-form'
        className='space-y-4'
        onSubmit={(e) => void submit(e)}
      >
        <ErrorNotice error={error} />
        {!deleting && (
          <FormFields
            error={error}
            fields={[
              { key: 'name', required: true },
              { key: 'code', required: true },
            ]}
            values={values}
            setValue={(k, v) => {
              setDirty(true);
              setValues((old) => ({ ...old, [k]: v }));
            }}
            disabled={busy}
          />
        )}
      </form>
      {guard.guard}
    </RouteDialog>
  );
}
