import { useTranslation } from '@nocobase/i18n/client';
import { Database, HardDrive } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

const localStorageExample = `drive:
  default: local
  disks:
    local:
      driver: fs
      location: /srv/my-app/storage/files
      visibility: private`;

export default function FileOverview() {
  const { t } = useTranslation(packageMetadata.name);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication>
        <section className='space-y-4 py-5'>
          <h4 className='flex items-center gap-2 text-sm font-semibold'>
            <HardDrive className='size-4 text-primary' aria-hidden />
            {t('fileOverview.current.storageTitle')}
            <code className='font-mono text-xs font-normal text-muted-foreground'>
              drive
            </code>
          </h4>
          <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {(['default', 'disks'] as const).map((field) => (
              <div key={field} className='space-y-2 rounded-lg bg-muted/50 p-3'>
                <dt className='text-xs text-muted-foreground'>
                  {t(`fileOverview.current.${field}`)}
                </dt>
                <dd className='text-sm font-medium'>
                  {t('fileOverview.current.unknown')}
                </dd>
              </div>
            ))}
          </dl>
          <div className='overflow-hidden rounded-lg border'>
            <Table aria-label={t('fileOverview.current.storageTitle')}>
              <TableHeader>
                <TableRow>
                  {(['diskName', 'driver', 'visibility'] as const).map(
                    (field) => (
                      <TableHead key={field}>
                        {t(`fileOverview.fields.${field}`)}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className='whitespace-normal py-4 text-xs leading-5 text-muted-foreground'
                  >
                    {t('fileOverview.current.storageUnavailable')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
        <section className='space-y-4 py-5'>
          <h4 className='flex items-center gap-2 text-sm font-semibold'>
            <Database className='size-4 text-primary' aria-hidden />
            {t('fileOverview.current.tablesTitle')}
          </h4>
          <dl>
            <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
              <dt>{t('fileOverview.current.count')}</dt>
              <dd className='font-medium text-muted-foreground'>
                {t('fileOverview.current.unknown')}
              </dd>
            </div>
          </dl>
          <div className='overflow-hidden rounded-lg border'>
            <Table aria-label={t('fileOverview.current.tablesTitle')}>
              <TableHeader>
                <TableRow>
                  {(
                    ['connection', 'collection', 'disk', 'resource'] as const
                  ).map((field) => (
                    <TableHead key={field}>
                      {t(`fileOverview.fields.${field}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='whitespace-normal py-4 text-xs leading-5 text-muted-foreground'
                  >
                    {t('fileOverview.current.tablesUnavailable')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </CurrentApplication>
      <ConfigurationActions title={t('fileOverview.actionsTitle')}>
        {(['drive', 'collection'] as const).map((action) => (
          <ConfigurationAction
            key={action}
            title={t(`fileOverview.actions.${action}.title`)}
            description={t(`fileOverview.actions.${action}.description`)}
            prompt={t(`fileOverview.actions.${action}.prompt`)}
            steps={(['inspect', 'configure', 'apply'] as const).map((step) =>
              t(`fileOverview.actions.${action}.${step}`),
            )}
            configuration={
              action === 'drive' ? (
                <div className='space-y-3'>
                  <h4 className='text-sm font-medium'>
                    {t('fileOverview.exampleTitle')}
                  </h4>
                  <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs leading-6'>
                    <code>{localStorageExample}</code>
                  </pre>
                  <p className='text-xs leading-5 text-muted-foreground'>
                    {t('fileOverview.exampleHint')}
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  <h4 className='text-sm font-medium'>
                    {t('fileOverview.fileConfigTitle')}
                  </h4>
                  <p className='text-sm leading-6 text-muted-foreground'>
                    {t('fileOverview.fileConfigHint')}
                  </p>
                  <dl className='divide-y rounded-lg border px-3'>
                    {(
                      [
                        ['connection', 'main'],
                        ['collection', 'invoice_files'],
                        ['disk', 'local'],
                        ['resource', 'invoiceAttachments'],
                      ] as const
                    ).map(([field, value]) => (
                      <div
                        key={field}
                        className='flex flex-wrap justify-between gap-2 py-2 text-xs'
                      >
                        <dt>{t(`fileOverview.fields.${field}`)}</dt>
                        <dd className='font-mono'>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )
            }
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
