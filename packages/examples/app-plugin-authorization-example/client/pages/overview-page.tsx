import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { useState, type ReactElement } from 'react';
import { apiClientToken, useService } from '@nocobase/app-client';
import { Button } from '../components/ui/button.js';
import { operationError } from './operation-error.js';
import { useTranslation } from '@nocobase/i18n/client';
import { useExample } from './use-example.js';
import { NS } from '../../catalog.js';
export default function OverviewPage(): ReactElement {
  const { t } = useTranslation(NS);
  const api = useService(apiClientToken);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function reset(): Promise<void> {
    setBusy(true);
    try {
      await api.request({
        method: 'POST',
        path: '/authorizationExample/reset',
      });
      setMessage('reset.done');
      setConfirmReset(false);
      context.reload();
    } catch (error) {
      setMessage(operationError(error));
    } finally {
      setBusy(false);
    }
  }
  const context = useExample<{
    canReset: boolean;
    roles: {
      key: string;
      title?: string | { key: string; ns: string };
      sources: { type: string; id: string }[];
    }[];
  }>('context');
  return (
    <PageContainer>
      <PageHeader title={t('sales.title')} description={t('sales.intro')} />
      <section className='space-y-3 rounded-xl border bg-card p-5'>
        <h2 className='font-semibold'>{t('access.title')}</h2>
        <p className='text-sm text-muted-foreground'>{t('access.coverage')}</p>
        {context.error && <p role='alert'>{t(context.error)}</p>}
        <ul className='space-y-2 text-sm'>
          {context.data?.roles.map((role) => (
            <li key={role.key}>
              <span className='font-medium'>
                {typeof role.title === 'object'
                  ? t(role.title.key, { ns: role.title.ns })
                  : (role.title ?? role.key)}
              </span>
              <span className='ml-3 text-muted-foreground'>
                {role.sources
                  .map((source) =>
                    source.type === 'user'
                      ? t('access.direct')
                      : `${source.type} · ${source.id}`,
                  )
                  .join(' / ')}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className='space-y-3 rounded-xl border bg-card p-5'>
        <h2 className='font-semibold'>{t('testAccounts')}</h2>
        <p className='text-sm'>{t('password')}</p>
        <table className='w-full text-left text-sm'>
          <thead>
            <tr>
              <th className='py-2'>{t('account')}</th>
              <th>{t('permissionSet')}</th>
            </tr>
          </thead>
          <tbody>
            {[
              'assistant',
              'engineer',
              'manager',
              'delivery',
              'proposal',
              'coordinator',
            ].map((key) => (
              <tr key={key} className='border-t'>
                <td className='py-3'>sales_{key}</td>
                <td>
                  <div>
                    {t(
                      `roles.${key === 'proposal' ? 'engineer' : key === 'coordinator' ? 'manager' : key}`,
                    )}
                  </div>
                  <p className='mt-1 text-muted-foreground'>
                    {`${t('access.direct')} · ${t(`accountMenus.${key}`)}`}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className='space-y-3 rounded-xl border bg-card p-5'>
        <h2 className='font-semibold'>{t('tryTitle')}</h2>
        <p className='text-sm leading-7'>{t('practice.intro')}</p>
        <ol className='space-y-4'>
          {['read', 'scopes', 'handover', 'delivery'].map((step, index) => (
            <li key={step} className='space-y-1'>
              <h3 className='font-medium'>
                {index + 1}. {t(`practice.${step}.title`)}
              </h3>
              <p className='text-sm'>{t(`practice.${step}.steps`)}</p>
              <p className='text-sm text-muted-foreground'>
                {t(`practice.${step}.reason`)}
              </p>
            </li>
          ))}
        </ol>
        <p className='text-sm text-muted-foreground'>
          {t('reset.description')}
        </p>
        {context.data?.canReset && (
          <div className='space-y-3'>
            {confirmReset ? (
              <>
                <p>{t('reset.confirm')}</p>
                <div className='flex gap-2'>
                  <Button disabled={busy} onClick={() => void reset()}>
                    {t('reset.action')}
                  </Button>
                  <Button
                    variant='outline'
                    disabled={busy}
                    onClick={() => setConfirmReset(false)}
                  >
                    {t('reset.cancel')}
                  </Button>
                </div>
              </>
            ) : (
              <Button variant='outline' onClick={() => setConfirmReset(true)}>
                {t('reset.action')}
              </Button>
            )}
          </div>
        )}
        {message && <p role='status'>{t(message)}</p>}
      </section>
    </PageContainer>
  );
}
