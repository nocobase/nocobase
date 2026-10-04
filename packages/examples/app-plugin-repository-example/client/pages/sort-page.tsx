import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';
import { CombineResultTable } from '../components/combine-result-table.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  sortExamples,
  sortExampleRequest,
  runSortExample,
  type SortExample,
} from '../sort.js';

const NS = '@nocobase/app-plugin-repository-example';
function SortCard({
  example,
}: {
  readonly example: SortExample;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(NS);
  const [rows, setRows] = useState<Record<string, unknown>[]>();
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<{
    message: string;
    expected: boolean;
  }>();
  const title = t(`sort_${example.key}_title`);
  async function run(): Promise<void> {
    setRunning(true);
    setRows(undefined);
    setFailure(undefined);
    try {
      const result = await runSortExample(api, example);
      if (example.expectedError)
        setFailure({ message: t('sortUnexpectedSuccess'), expected: false });
      else setRows(result);
    } catch (error) {
      const code = error instanceof ApiClientError ? error.reason : undefined;
      setFailure({
        message: `${code ? `${code}: ` : ''}${error instanceof Error ? error.message : t('loadError')}`,
        expected: !!example.expectedError && code === example.expectedError,
      });
    } finally {
      setRunning(false);
    }
  }
  return (
    <Card
      role='region'
      aria-label={title}
      className='min-w-0 shadow-2xs rounded-xl'
    >
      <CardHeader>
        <CardTitle className='text-base font-semibold'>{title}</CardTitle>
        <CardDescription className='text-xs leading-relaxed'>
          {t(`sort_${example.key}_description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='overflow-hidden rounded-lg border bg-muted/40'>
          <pre className='overflow-auto p-3 text-xs font-mono font-medium text-foreground'>
            <code>{example.builder}</code>
          </pre>
        </div>
        <details className='rounded-lg border bg-muted/15 p-3 text-xs'>
          <summary className='cursor-pointer font-medium text-foreground'>
            {t('sortRequest')}
          </summary>
          <pre className='mt-3 max-h-96 overflow-auto font-mono text-xs text-muted-foreground'>
            {JSON.stringify(
              {
                repository: example.repository,
                action: 'findMany',
                options: sortExampleRequest(example),
              },
              null,
              2,
            )}
          </pre>
        </details>
        <div>
          <Button
            size='sm'
            className='gap-1.5 font-medium'
            disabled={running}
            onClick={() => void run()}
          >
            {running ? t('loading') : t('combineRun')}
          </Button>
        </div>
        {running && (
          <p role='status' className='text-xs text-muted-foreground'>
            {t('loading')}
          </p>
        )}
        {failure && (
          <p
            role={failure.expected ? 'status' : 'alert'}
            className={
              failure.expected
                ? 'rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed'
                : 'rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive font-medium leading-relaxed'
            }
          >
            {failure.expected && `${t('sortExpectedError')} — `}
            {failure.message}
          </p>
        )}
        {rows && (
          <div
            className='space-y-3 pt-1'
            role='region'
            aria-label={t('combineResult')}
          >
            <p className='text-xs text-muted-foreground font-medium'>
              {t(rows.length ? 'sortResultHint' : 'combineEmpty')}
            </p>
            {rows.length > 0 && (
              <CombineResultTable
                rows={rows}
                label={`${title} — ${t('combineTable')}`}
              />
            )}
            <details className='rounded-lg border bg-muted/15 p-3 text-xs'>
              <summary className='cursor-pointer font-medium text-foreground'>
                {t('combineJson')}
              </summary>
              <pre className='mt-3 max-h-96 overflow-auto font-mono text-xs text-muted-foreground'>
                {JSON.stringify(rows, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default function SortPage(): ReactElement {
  const { t } = useTranslation(NS);
  return (
    <PageContainer>
      <PageHeader description={t('sortIntro')} title={t('sortTitle')} />
      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed'>
        <p>{t('sortLimits')}</p>
      </div>
      <div className='space-y-4'>
        {sortExamples.map((example) => (
          <SortCard key={example.key} example={example} />
        ))}
      </div>
    </PageContainer>
  );
}
