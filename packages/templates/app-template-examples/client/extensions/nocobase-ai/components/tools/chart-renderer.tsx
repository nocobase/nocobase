import { useTranslation } from '@nocobase/i18n/client';
import { LoadingState } from '../../shared/loading-state.js';
import { NocoBaseErrorBoundary } from '../../shared/error-boundary.js';
import { LoaderCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import type { AIToolRendererProps } from './tool-renderer-provider.js';
import { asRecord } from './tool-renderer-utils.js';

const EChartsPreview = lazy(() => import('./echarts-preview.js'));

export function ChartPreview({
  options,
}: {
  options: Record<string, unknown>;
}) {
  return (
    <Suspense fallback={<LoadingState className='h-[280px]' />}>
      <EChartsPreview options={options} />
    </Suspense>
  );
}

export function ChartRenderer({ part }: AIToolRendererProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const input = asRecord(part.input);
  const options = asRecord(input.options);
  if (!Object.keys(options).length) {
    return (
      <div className='flex items-center gap-2 py-2 text-xs text-muted-foreground'>
        <LoaderCircle className='size-4 animate-spin' />
        {t('tool.chart.generating', 'Generating chart…')}
      </div>
    );
  }
  return (
    <NocoBaseErrorBoundary variant='region' resetKeys={[part.input]}>
      <div className='rounded-lg border bg-background p-3'>
        <ChartPreview options={options} />
      </div>
    </NocoBaseErrorBoundary>
  );
}
