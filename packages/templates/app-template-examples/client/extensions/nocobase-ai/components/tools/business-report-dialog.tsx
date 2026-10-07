import { useTranslation } from '@nocobase/i18n/client';
import { MarkdownMessage } from '../chat/markdown-message.js';
import { LoadingState } from '../../shared/loading-state.js';
import { Button } from '../../shared/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../shared/ui/dialog.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../shared/ui/tabs.js';
import { Download, FileCode2, LoaderCircle, Printer } from 'lucide-react';
import {
  Component,
  lazy,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildBusinessReportHtml,
  buildBusinessReportMarkdown,
  downloadBusinessReportFile,
  getBusinessReportFileName,
  printBusinessReport,
  splitBusinessReportMarkdown,
  type BusinessReportData,
} from './business-report-utils.js';
import { BusinessReportDialogContext } from './business-report-dialog-context.js';
import { withStableKeys } from '../../shared/keys.js';

type BusinessReportDialogSnapshot = {
  open: boolean;
  toolCallId?: string;
  report?: BusinessReportData;
  ready: boolean;
  chartError?: boolean;
};

const closedSnapshot: BusinessReportDialogSnapshot = {
  open: false,
  ready: false,
};
const EChartsPreview = lazy(() => import('./echarts-preview.js'));

const sameCharts = (
  left: BusinessReportData['charts'],
  right: BusinessReportData['charts'],
) => left === right || JSON.stringify(left) === JSON.stringify(right);

const sameReport = (
  left: BusinessReportData | undefined,
  right: BusinessReportData,
) =>
  left?.title === right.title &&
  left.summary === right.summary &&
  left.markdown === right.markdown &&
  left.fileName === right.fileName &&
  sameCharts(left.charts, right.charts);

export function BusinessReportDialogProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(closedSnapshot);
  const [renderErrors, setRenderErrors] = useState<
    Record<string, BusinessReportData>
  >({});
  const hasRenderError = useCallback(
    (toolCallId: string, report: BusinessReportData) =>
      sameReport(renderErrors[toolCallId], report),
    [renderErrors],
  );
  const onChartError = useCallback(() => {
    const { toolCallId, report } = state;
    if (!toolCallId || !report) return;
    setRenderErrors((current) =>
      sameReport(current[toolCallId], report)
        ? current
        : { ...current, [toolCallId]: report },
    );
  }, [state]);
  const open = useCallback(
    (toolCallId: string, report: BusinessReportData, ready: boolean) =>
      setState({ open: ready, toolCallId, report, ready }),
    [],
  );
  const update = useCallback(
    (toolCallId: string, report: BusinessReportData, ready: boolean) =>
      setState((current) => {
        if (current.toolCallId !== toolCallId) return current;
        if (current.ready === ready && sameReport(current.report, report)) {
          return current;
        }
        return {
          ...current,
          open: current.open && ready,
          report,
          ready,
        };
      }),
    [],
  );
  const controller = useMemo(
    () => ({
      open,
      update,
      hasRenderError,
    }),
    [open, update, hasRenderError],
  );
  return (
    <BusinessReportDialogContext.Provider value={controller}>
      {children}
      <BusinessReportDialogHost
        state={{
          ...state,
          chartError:
            state.toolCallId && state.report
              ? hasRenderError(state.toolCallId, state.report)
              : false,
        }}
        onChartError={onChartError}
        onOpenChange={(nextOpen) =>
          setState((current) =>
            current.open === nextOpen
              ? current
              : { ...current, open: nextOpen },
          )
        }
      />
    </BusinessReportDialogContext.Provider>
  );
}

class ReportChartErrorBoundary extends Component<
  PropsWithChildren<{
    onError: () => void;
    fallback: ReactNode;
    failed?: boolean;
  }>,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed || this.props.failed
      ? this.props.fallback
      : this.props.children;
  }
}

function ChartPreview({ options }: { options: Record<string, unknown> }) {
  return (
    <Suspense fallback={<LoadingState className='h-[280px]' />}>
      <EChartsPreview options={options} />
    </Suspense>
  );
}

function BusinessReportDialogHost({
  state,
  onOpenChange,
  onChartError,
}: {
  state: BusinessReportDialogSnapshot;
  onChartError: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const report = state.report;
  const [activeTab, setActiveTab] = useState('preview');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [htmlPreviewSignature, setHtmlPreviewSignature] = useState('');
  const [htmlErrorSignature, setHtmlErrorSignature] = useState('');
  const [exporting, setExporting] = useState<'html' | 'pdf'>();
  const [exportError, setExportError] = useState<string>();
  const reportSignature = useMemo(
    () => (state.ready && report ? JSON.stringify(report) : ''),
    [report, state.ready],
  );
  const reportMarkdown = useMemo(
    () =>
      state.open && state.ready && report
        ? buildBusinessReportMarkdown(report)
        : '',
    [report, state.open, state.ready],
  );
  const previewParts = useMemo(
    () =>
      activeTab === 'preview' && reportMarkdown
        ? splitBusinessReportMarkdown(reportMarkdown)
        : [],
    [activeTab, reportMarkdown],
  );

  const exportHtml = async () => {
    if (!report) return;
    setExportError(undefined);
    setExporting('html');
    try {
      const html = await buildBusinessReportHtml(report, { printMode: true });
      downloadBusinessReportFile(
        `${fileName}.html`,
        html,
        'text/html;charset=utf-8',
      );
    } catch (error) {
      onChartError();
      setExportError(
        error instanceof Error
          ? error.message
          : t('tool.businessReport.exportHtmlError', 'Unable to export HTML'),
      );
    } finally {
      setExporting(undefined);
    }
  };

  const printPdf = async () => {
    if (!report) return;
    setExportError(undefined);
    setExporting('pdf');
    try {
      const opened = await printBusinessReport(report);
      if (!opened) {
        setExportError(
          t(
            'tool.businessReport.popupBlocked',
            'Popup blocked. Allow popups and try printing again.',
          ),
        );
      }
    } catch (error) {
      onChartError();
      setExportError(
        error instanceof Error
          ? error.message
          : t('tool.businessReport.printError', 'Unable to print report'),
      );
    } finally {
      setExporting(undefined);
    }
  };

  // A new tool call resets the dialog while rendering rather than in an
  // effect, so the first render already shows the new report's preview tab.
  const [syncedToolCallId, setSyncedToolCallId] = useState(state.toolCallId);
  if (syncedToolCallId !== state.toolCallId) {
    setSyncedToolCallId(state.toolCallId);
    setActiveTab('preview');
    setHtmlPreview('');
    setHtmlPreviewSignature('');
    setHtmlErrorSignature('');
    setExportError(undefined);
  }

  // Whether the HTML tab is waiting for a build is derived from what has been
  // built, so the effect only records results and never toggles a flag.
  const htmlPreviewReady =
    Boolean(htmlPreview) && htmlPreviewSignature === reportSignature;
  const htmlLoading =
    state.open &&
    activeTab === 'html' &&
    state.ready &&
    !state.chartError &&
    Boolean(report) &&
    !htmlPreviewReady &&
    htmlErrorSignature !== reportSignature;

  useEffect(() => {
    if (!htmlLoading || !report) return;
    let active = true;
    void buildBusinessReportHtml(report)
      .then((html) => {
        if (!active) return;
        setHtmlPreview(html);
        setHtmlPreviewSignature(reportSignature);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setHtmlErrorSignature(reportSignature);
        onChartError();
        setExportError(
          error instanceof Error
            ? error.message
            : t('tool.businessReport.buildHtmlError', 'Unable to build HTML'),
        );
      });
    return () => {
      active = false;
    };
  }, [htmlLoading, report, reportSignature, onChartError, t]);

  if (!report) return null;
  const summary =
    report.summary ||
    t(
      'tool.businessReport.openHint',
      'Open the report to review the generated analysis.',
    );
  const fileName = getBusinessReportFileName(report);

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className='h-[86svh] w-[min(980px,calc(100vw-2rem))] max-w-[980px] grid-rows-[auto_1fr_auto] overflow-hidden p-0 sm:max-w-[980px]'>
        <div className='border-b px-5 py-4'>
          <DialogTitle>{report.title}</DialogTitle>
          <DialogDescription className='mt-1'>{summary}</DialogDescription>
          {state.chartError ? (
            <p role='alert' className='mt-3 text-sm text-destructive'>
              {t(
                'tool.businessReport.chartFailed',
                'Report chart rendering failed. Correct the chart options and retry.',
              )}
            </p>
          ) : null}
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(String(value))}
          className='min-h-0 overflow-hidden px-5 py-4'
        >
          <TabsList>
            <TabsTrigger value='preview'>
              {t('tool.businessReport.preview', 'Preview')}
            </TabsTrigger>
            <TabsTrigger value='markdown'>Markdown</TabsTrigger>
            <TabsTrigger value='html'>HTML</TabsTrigger>
          </TabsList>
          <TabsContent
            value='preview'
            className='mt-3 min-h-0 overflow-auto rounded-lg border bg-background p-5'
          >
            <ReportChartErrorBoundary
              key={`${state.toolCallId}:${reportSignature}`}
              onError={onChartError}
              failed={state.chartError}
              fallback={
                <p className='rounded-lg border border-destructive p-4 text-sm text-destructive'>
                  {t(
                    'tool.businessReport.previewUnavailable',
                    'Chart preview is unavailable.',
                  )}
                </p>
              }
            >
              <div className='space-y-4'>
                {withStableKeys(previewParts, (item) => item.type).map(
                  ({ key, item }) =>
                    item.type === 'markdown' ? (
                      <div key={key} className='ai-markdown'>
                        <MarkdownMessage variant='document'>
                          {item.content}
                        </MarkdownMessage>
                      </div>
                    ) : (
                      <div key={key} className='rounded-lg border p-3'>
                        <ChartPreview options={item.options} />
                      </div>
                    ),
                )}
              </div>
            </ReportChartErrorBoundary>
          </TabsContent>
          <TabsContent
            value='markdown'
            className='mt-3 min-h-0 overflow-auto rounded-lg bg-muted p-4'
          >
            <pre className='whitespace-pre-wrap break-words font-mono text-xs leading-5'>
              {reportMarkdown}
            </pre>
          </TabsContent>
          <TabsContent
            value='html'
            className='mt-3 min-h-0 overflow-hidden rounded-lg border bg-background'
          >
            {htmlPreviewReady ? (
              <iframe
                title={t(
                  'tool.businessReport.htmlPreview',
                  '{{title}} HTML preview',
                  { title: report.title },
                )}
                sandbox=''
                srcDoc={htmlPreview}
                className='size-full min-h-[480px] border-0 bg-white'
              />
            ) : htmlLoading ? (
              <LoadingState className='h-full min-h-[480px]' />
            ) : (
              <div className='flex h-full min-h-[480px] items-center justify-center gap-2 text-sm text-muted-foreground'>
                {t(
                  'tool.businessReport.htmlUnavailable',
                  'HTML is unavailable',
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className='flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3'>
          {exportError ? (
            <p className='mr-auto text-xs text-destructive'>{exportError}</p>
          ) : null}
          <Button
            variant='outline'
            disabled={!state.ready || state.chartError}
            onClick={() =>
              downloadBusinessReportFile(
                `${fileName}.md`,
                reportMarkdown,
                'text/markdown;charset=utf-8',
              )
            }
          >
            <Download />
            {t('tool.businessReport.downloadMarkdown', 'Download Markdown')}
          </Button>
          <Button
            variant='outline'
            disabled={
              !state.ready || state.chartError || exporting !== undefined
            }
            onClick={() => void exportHtml()}
          >
            {exporting === 'html' ? (
              <LoaderCircle className='animate-spin' />
            ) : (
              <FileCode2 />
            )}
            {t('tool.businessReport.downloadHtml', 'Download HTML')}
          </Button>
          <Button
            disabled={
              !state.ready || state.chartError || exporting !== undefined
            }
            onClick={() => void printPdf()}
          >
            {exporting === 'pdf' ? (
              <LoaderCircle className='animate-spin' />
            ) : (
              <Printer />
            )}
            {t('tool.businessReport.printPdf', 'Print PDF')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
