import { useFileSubmission } from '../submission.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useApiClient, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';

import { FileList } from '../components/file-list.js';
import { FileUploadField } from '../components/file-upload-field.js';
import {
  ordersRepository,
  resources,
  type BusinessFileRecord,
  type MutationValues,
  type OrderRecord,
  type OrderStatus,
} from '../lib/business.js';
import { useFileLabels } from '../lib/labels.js';

interface OrderRow {
  readonly order: OrderRecord;
  readonly attachments: readonly BusinessFileRecord[];
}

const statusClasses: Readonly<Record<OrderStatus, string>> = {
  draft: 'bg-muted text-muted-foreground border border-border/60',
  submitted: 'bg-primary/10 text-primary border border-primary/20',
  archived: 'bg-secondary text-secondary-foreground border border-border/60',
};

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/** One-to-many demo: every order owns any number of attachment files. */
export default function OrderAttachmentsPage(): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-file-example');
  const labels = useFileLabels();
  const api = useApiClient();
  const manager = useService(clientFileRepositoryManagerToken);
  const orders = useMemo(() => ordersRepository(api), [api]);
  const attachments = useMemo(
    () => manager.repository(resources.orderAttachments),
    [manager],
  );
  const [rows, setRows] = useState<readonly OrderRow[]>([]);
  const [busyId, setBusyId] = useState<string>();
  const [error, setError] = useState('');

  const fetchRows = useCallback(async (): Promise<readonly OrderRow[]> => {
    const [orderRows, fileRows] = await Promise.all([
      orders.findMany({ limit: 50 }),
      attachments.findMany({
        limit: 100,
        sort: (s) => s.field('createdAt').desc(),
      }),
    ]);
    const businessFiles: readonly BusinessFileRecord[] = fileRows;
    const grouped = new Map<string, BusinessFileRecord[]>();
    for (const file of businessFiles) {
      if (!file.orderId) continue;
      const list = grouped.get(file.orderId) ?? [];
      list.push(file);
      grouped.set(file.orderId, list);
    }
    return orderRows
      .map((order) => ({
        order,
        attachments: grouped.get(order.id) ?? [],
      }))
      .sort((left, right) =>
        left.order.number.localeCompare(right.order.number),
      );
  }, [orders, attachments]);

  useEffect(() => {
    let active = true;
    void fetchRows().then(
      (loaded) => {
        if (active) setRows(loaded);
      },
      (cause: unknown) => {
        if (active) setError(messageOf(cause));
      },
    );
    return () => {
      active = false;
    };
  }, [fetchRows]);

  const submission = useFileSubmission();
  const mutate = useCallback(
    async (orderId: string, values: MutationValues): Promise<void> => {
      setBusyId(orderId);
      setError('');
      try {
        await submission.run(
          { filter: { id: orderId }, values },
          (idempotencyKey, snapshot) =>
            orders.updateOne({ ...snapshot, idempotencyKey }),
        );
        setRows(await fetchRows());
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setBusyId(undefined);
      }
    },
    [orders, fetchRows, submission],
  );

  const amount = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [i18n.language],
  );

  return (
    <PageContainer>
      <PageHeader
        description={`${t('ordersDescription')} ${t('ordersRelationHint')}`}
        title={t('ordersTitle')}
      />
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
          <button
            type='button'
            disabled={submission.submitting}
            onClick={() => {
              void (async () => {
                try {
                  await submission.retry();
                  setRows(await fetchRows());
                  setError('');
                } catch (cause) {
                  setError(messageOf(cause));
                }
              })();
            }}
          >
            {t('retrySubmission')}
          </button>
        </p>
      )}
      <div className='space-y-4'>
        {rows.map(({ order, attachments: files }) => (
          <section
            key={order.id}
            className='space-y-4 rounded-xl border bg-card p-5 shadow-2xs'
          >
            <header className='flex flex-wrap items-center gap-3 border-b pb-3.5'>
              <h2 className='font-mono font-semibold text-base text-foreground'>
                {order.number}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[order.status]}`}
              >
                {t(`status.${order.status}`)}
              </span>
              <span className='text-sm text-muted-foreground'>
                {order.customerName}
              </span>
              <span className='ml-auto font-mono text-sm font-semibold tabular-nums text-foreground'>
                {amount.format(order.amountCents / 100)}
              </span>
            </header>
            <FileList
              files={files}
              labels={{ ...labels, remove: t('unlink') }}
              disabled={
                submission.submitting ||
                submission.pending ||
                busyId === order.id
              }
              emptyState={t('ordersNoFiles')}
              onRemove={(file) =>
                mutate(order.id, {
                  attachments: { disconnect: [{ id: file.id }] },
                })
              }
            />
            <FileUploadField
              repository={attachments}
              labels={labels}
              multiple
              disabled={
                submission.submitting ||
                submission.pending ||
                busyId === order.id
              }
              onChange={(records) =>
                mutate(order.id, {
                  attachments: {
                    connect: records.map((record) => ({ id: record.id })),
                  },
                })
              }
            />
          </section>
        ))}
      </div>
      {!rows.length && (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center bg-card/40'>
          <p role='status' className='text-xs text-muted-foreground'>
            {t('ordersEmpty')}
          </p>
        </div>
      )}
      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed'>
        <p>{t('ordersHint')}</p>
      </div>
    </PageContainer>
  );
}
