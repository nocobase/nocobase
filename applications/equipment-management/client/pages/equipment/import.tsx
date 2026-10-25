import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { Textarea } from '#components/ui/textarea';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { DataTable } from '#components/data-table';
import { toast } from '#components/ui/toast';
import { useEquipmentWrite } from './api.js';
import { useFormGuard } from './form-guard.js';
import { ErrorNotice } from './shared.js';
import { downloadCsv } from './download.js';
interface Preview {
  rows: {
    row: number;
    action: string;
    assetNumber: string;
    errors: string[];
  }[];
  count: number;
  committed: boolean;
}
export default function CsvImport() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const write = useEquipmentWrite();
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<Preview>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const guard = useFormGuard(!!csv, busy);
  async function run(commit: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      const result = await write<Preview>(
        'import/' + (commit ? 'commit' : 'preview'),
        { csv },
      );
      setPreview(result);
      if (commit) {
        toast.add({
          title: t('equipment.successImported', { count: result.count }),
          type: 'success',
        });
        guard.allowLeave();
        await navigate(
          { pathname: '..', search: location.search },
          { relative: 'route', replace: true },
        );
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  const template =
    'assetNumber,name,serialNumber,model,manufacturer,categoryId,departmentId,locationId,purchaseDate,purchaseCost,vendor,warrantyUntil,nextMaintenanceAt,notes\r\n';
  return (
    <RouteDialog
      title={t('equipment.import')}
      description={t('equipment.csvHint')}
      className='max-w-3xl'
      beforeClose={guard.beforeClose}
      footer={
        <>
          <Button
            variant='outline'
            disabled={busy}
            nativeButton={false}
            render={<Link to={{ pathname: '..', search: location.search }} />}
          >
            {t('equipment.cancel')}
          </Button>
          <Button
            variant='outline'
            disabled={busy || !csv}
            onClick={() => void run(false)}
          >
            {t('equipment.preview')}
          </Button>
          <Button
            disabled={
              busy || !preview || preview.rows.some((r) => r.errors.length > 0)
            }
            onClick={() => void run(true)}
          >
            {t('equipment.commit')}
          </Button>
        </>
      }
    >
      <form
        className='space-y-4'
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void run(false);
        }}
      >
        <ErrorNotice error={error} />
        <Button
          variant='outline'
          onClick={() => downloadCsv(template, 'equipment-import-template.csv')}
        >
          {t('equipment.downloadTemplate')}
        </Button>
        <Label htmlFor='csv-file'>{t('equipment.chooseFile')}</Label>
        <Input
          id='csv-file'
          type='file'
          accept='.csv,text/csv'
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void file
                .text()
                .then((value) => {
                  setCsv(value);
                  setPreview(undefined);
                })
                .catch(setError);
          }}
        />
        <Label htmlFor='csv-content'>{t('equipment.csv')}</Label>
        <Textarea
          id='csv-content'
          value={csv}
          disabled={busy}
          rows={8}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(undefined);
          }}
        />
        <p className='text-sm text-muted-foreground'>
          {preview
            ? t('equipment.csvReady', { count: preview.count })
            : t('equipment.csvEmpty')}
        </p>
        {preview && (
          <DataTable
            data={preview.rows}
            pagination={false}
            columns={[
              { accessorKey: 'row', header: t('equipment.row') },
              {
                accessorKey: 'assetNumber',
                header: t('equipment.fields.assetNumber'),
              },
              {
                accessorKey: 'action',
                header: t('equipment.action'),
                cell: ({ row }) =>
                  t('equipment.' + row.original.action + 'Action'),
              },
              {
                accessorKey: 'errors',
                header: t('equipment.errors'),
                cell: ({ row }) =>
                  row.original.errors.length ? (
                    <span className='text-destructive'>
                      {row.original.errors.join(', ')}
                    </span>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        )}
      </form>
      {guard.guard}
    </RouteDialog>
  );
}
