import { useTranslation } from '@nocobase/i18n/client';
import { Badge } from '../../shared/ui/badge.js';
import { cn } from '../../shared/utils.js';
import { FileText, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { getNocoBaseToolCallMetadata } from '../chat/tool-call-utils.js';
import type { AIToolRendererProps } from './tool-renderer-provider.js';
import {
  getValidatedBusinessReport,
  type BusinessReportData,
} from './business-report-utils.js';
import { useBusinessReportDialog } from './business-report-dialog-context.js';

function ReportGeneratingProgress() {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  return (
    <div
      role='progressbar'
      aria-label={t(
        'tool.businessReport.generating',
        'Generating business report',
      )}
      className='mt-3 h-1 w-full overflow-hidden rounded-full bg-muted'
    >
      <svg
        viewBox='0 0 100 4'
        preserveAspectRatio='none'
        aria-hidden='true'
        className='block size-full motion-reduce:hidden'
      >
        <rect
          x='-28'
          y='0'
          width='28'
          height='4'
          rx='2'
          className='fill-primary'
        >
          <animate
            attributeName='x'
            values='-28;100'
            dur='1.35s'
            repeatCount='indefinite'
          />
        </rect>
      </svg>
      <div className='hidden h-full w-2/3 rounded-full bg-primary motion-reduce:block' />
    </div>
  );
}

export function BusinessReportRenderer({ part }: AIToolRendererProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const reportDialog = useBusinessReportDialog();
  const output = 'output' in part ? part.output : undefined;
  const validatedReport = useMemo(
    () => getValidatedBusinessReport(output),
    [output],
  );
  const metadata = getNocoBaseToolCallMetadata(part);
  const completed =
    part.state === 'output-available' ||
    ['done', 'confirmed', 'cancelled', 'rejected', 'error', 'failed'].includes(
      metadata?.invokeStatus ?? '',
    );
  const failed =
    part.state === 'output-error' ||
    metadata?.status === 'error' ||
    ['cancelled', 'rejected', 'error', 'failed'].includes(
      metadata?.invokeStatus ?? '',
    );
  const ready = completed && !failed && validatedReport !== undefined;
  const generating = !completed && !failed;
  const defaultTitle = t(
    'tool.businessReport.defaultTitle',
    'Business analysis report',
  );
  const report = useMemo<BusinessReportData>(
    () =>
      ready && validatedReport
        ? validatedReport
        : { title: defaultTitle, markdown: '', charts: [] },
    [defaultTitle, ready, validatedReport],
  );
  const { title, charts } = report;
  const renderFailed =
    ready && reportDialog.hasRenderError(part.toolCallId, report);
  const previewReady = ready && !renderFailed;
  const summary = renderFailed
    ? t(
        'tool.businessReport.chartFailed',
        'Report chart rendering failed. Correct the chart options and retry.',
      )
    : !generating && !ready
      ? t(
          'tool.businessReport.failed',
          'Report validation failed. Correct the report and retry.',
        )
      : report.summary ||
        t(
          'tool.businessReport.openHint',
          'Open the report to review the generated analysis.',
        );
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    reportDialog.update(part.toolCallId, report, ready);
  }, [part.toolCallId, ready, report, reportDialog]);

  useEffect(() => {
    if (generating) {
      wasGeneratingRef.current = true;
      return;
    }
    if (wasGeneratingRef.current && previewReady) {
      reportDialog.open(part.toolCallId, report, ready);
    }
    wasGeneratingRef.current = false;
  }, [generating, part.toolCallId, previewReady, ready, report, reportDialog]);

  return (
    <button
      type='button'
      className={cn(
        'w-full rounded-lg border bg-background p-3 text-left transition-colors',
        ready && 'hover:bg-muted/40',
      )}
      disabled={!ready}
      onClick={() => reportDialog.open(part.toolCallId, report, ready)}
    >
      <div className='flex items-start gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30'>
          {generating ? (
            <LoaderCircle className='size-4 animate-spin' />
          ) : (
            <FileText className='size-4' />
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='font-medium'>{title}</div>
          <p className='mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground'>
            {summary}
          </p>
          <div className='mt-2 flex flex-wrap gap-1.5'>
            <Badge variant='secondary'>
              {generating
                ? t('tool.businessReport.generatingBadge', 'Generating')
                : previewReady
                  ? 'Markdown'
                  : t('tool.status.failed', 'Failed')}
            </Badge>
            <Badge variant='outline'>
              {t('tool.businessReport.chartCount', '{{count}} charts', {
                count: charts.length,
              })}
            </Badge>
            {previewReady ? (
              <Badge variant='outline'>
                {t('tool.businessReport.previewExport', 'Preview and export')}
              </Badge>
            ) : null}
          </div>
          {generating ? <ReportGeneratingProgress /> : null}
        </div>
      </div>
    </button>
  );
}
