import { useTranslation } from '@nocobase/i18n/client';
import { Building2, CalendarDays, Mail, UserRound } from 'lucide-react';
import type { ReactElement } from 'react';
import { useParams } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { useCustomers, useMoney } from './data.js';
import { Owner, StageBadge } from './index.js';

export default function CustomerDetail(): ReactElement {
  const { id } = useParams();
  const rows = useCustomers();
  const row = rows.find((item) => item.id === id);
  const { t, i18n } = useTranslation();
  const money = useMoney();
  return (
    <RouteDrawer
      title={row?.name ?? t('themeLab.missing')}
      description={t('themeLab.customerDetail')}
    >
      {row ? (
        <div className='flex flex-col gap-6'>
          <div className='flex items-center gap-3'>
            <span className='flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Building2 className='size-6' />
            </span>
            <div className='flex flex-col gap-2'>
              <p className='text-sm text-muted-foreground'>
                {row.industry || '—'}
              </p>
              <StageBadge stage={row.stage} />
            </div>
          </div>
          <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-5 text-sm'>
            {(
              [
                ['contact', row.contact],
                ['email', row.email],
                ['owner', <Owner key='owner' name={row.owner} />],
                ['amount', money(row.amount)],
                [
                  'updated',
                  new Intl.DateTimeFormat(i18n.language, {
                    dateStyle: 'medium',
                    timeZone: 'UTC',
                  }).format(new Date(row.updated)),
                ],
              ] as const
            ).map(([label, value]) => (
              <div key={String(label)} className='contents'>
                <dt className='text-muted-foreground'>
                  {t(`themeLab.${label}`)}
                </dt>
                <dd className='min-w-0 break-words'>{value || '—'}</dd>
              </div>
            ))}
          </dl>
          <Card>
            <CardHeader>
              <CardTitle>{t('themeLab.activity')}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-5'>
              {(
                [
                  ['0', Mail],
                  ['1', CalendarDays],
                  ['2', UserRound],
                ] as const
              ).map(([index, Icon]) => (
                <div key={index} className='flex items-start gap-3'>
                  <span className='rounded-lg bg-muted p-2'>
                    <Icon className='size-4' />
                  </span>
                  <div>
                    <p className='text-sm font-medium'>
                      {t(`themeLab.activity${index}`)}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {t(`themeLab.activityHint${index}`)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <p className='text-xs text-muted-foreground'>
            {t('themeLab.previewHint')}
          </p>
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('themeLab.missingHint')}
        </p>
      )}
    </RouteDrawer>
  );
}
