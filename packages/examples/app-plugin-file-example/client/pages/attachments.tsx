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
import { useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  clientFileRepositoryManagerToken,
  type FileRecord,
} from '@nocobase/app-plugin-file/client';

import { FileList } from '../components/file-list.js';
import { FileUploadField } from '../components/file-upload-field.js';
import { useFileLabels } from '../lib/labels.js';

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/** Flat File Repository demo: upload, list, preview and delete metadata. */
export default function AttachmentsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-file-example');
  const labels = useFileLabels();
  const manager = useService(clientFileRepositoryManagerToken);
  const repository = useMemo(
    () => manager.repository('attachments'),
    [manager],
  );
  const [records, setRecords] = useState<readonly FileRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(
    async (): Promise<readonly FileRecord[]> =>
      repository.findMany({
        limit: 100,
        sort: (s) => s.field('createdAt').desc(),
      }),
    [repository],
  );

  useEffect(() => {
    let active = true;
    void fetchRecords().then(
      (rows) => {
        if (active) setRecords(rows);
      },
      (cause: unknown) => {
        if (active) setError(messageOf(cause));
      },
    );
    return () => {
      active = false;
    };
  }, [fetchRecords]);

  const submission = useFileSubmission();
  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<void> => {
      setBusy(true);
      setError('');
      try {
        await action();
        setRecords(await fetchRecords());
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setBusy(false);
      }
    },
    [fetchRecords],
  );

  return (
    <PageContainer>
      <PageHeader
        description={`${t('description')} ${t('apiHint')}`}
        title={t('title')}
      />
      <section
        aria-label={t('officePreviewTitle')}
        className='rounded-xl border bg-card p-4 text-card-foreground'
      >
        <h2 className='font-medium'>{t('officePreviewTitle')}</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {t('officePreviewDescription')}
        </p>
        <p className='mt-2 text-xs text-muted-foreground'>
          {t('officePreviewLimits')}
        </p>
      </section>
      <FileUploadField
        repository={repository}
        labels={labels}
        multiple
        disabled={busy || submission.submitting || submission.pending}
        onChange={() => run(async () => undefined)}
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
                  setRecords(await fetchRecords());
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
      <FileList
        files={records}
        labels={labels}
        disabled={busy || submission.submitting || submission.pending}
        onRemove={(file) =>
          run(() =>
            submission.run(
              { filter: { id: file.id } },
              (idempotencyKey, snapshot) =>
                repository.deleteOne({ ...snapshot, idempotencyKey }),
            ),
          )
        }
      />
      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed'>
        <p>{t('retention')}</p>
      </div>
    </PageContainer>
  );
}
