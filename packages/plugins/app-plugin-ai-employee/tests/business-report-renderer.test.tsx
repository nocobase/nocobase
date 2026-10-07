// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { useLayoutEffect, type ReactNode } from 'react';
import { BusinessReportDialogProvider } from '../registry/nocobase-ai/components/tools/business-report-dialog.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import { BusinessReportService } from '../server/service/business-report-service.js';
import { BusinessReportRenderer } from '../registry/nocobase-ai/components/tools/business-report-renderer.js';
import {
  buildBusinessReportHtml,
  buildBusinessReportMarkdown,
  getValidatedBusinessReport,
  splitBusinessReportMarkdown,
} from '../registry/nocobase-ai/components/tools/business-report-utils.js';
import type { AIToolRendererProps } from '../registry/nocobase-ai/components/tools/tool-renderer-provider.js';

const exportRuntime = vi.hoisted(() => ({
  setOption: vi.fn(() => {
    throw new Error('ECharts setOption failed');
  }),
  dispose: vi.fn(),
}));
vi.mock('../registry/nocobase-ai/components/tools/echarts-runtime.js', () => ({
  prepareEChartsRuntime: async () => ({ init: () => exportRuntime }),
}));

const dialog = vi.hoisted(() => ({
  open: vi.fn(),
  update: vi.fn(),
  hasRenderError: vi.fn(() => false),
  real: false,
  chartThrows: false,
  chartFailurePhase: 'mount' as 'render' | 'mount',
}));
vi.mock(
  '../registry/nocobase-ai/components/tools/business-report-dialog-context.js',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../registry/nocobase-ai/components/tools/business-report-dialog-context.js')
      >();
    return {
      ...actual,
      useBusinessReportDialog: () =>
        dialog.real ? actual.useBusinessReportDialog() : dialog,
    };
  },
);
vi.mock('../registry/nocobase-ai/components/chat/markdown-message.js', () => ({
  MarkdownMessage: ({ children }: { children: string }) => (
    <div>{children}</div>
  ),
}));
vi.mock('../registry/nocobase-ai/components/tools/echarts-preview.js', () => ({
  default: function RuntimeChart() {
    useLayoutEffect(() => {
      // setOption is called during the chart wrapper's mount lifecycle.
      if (dialog.chartThrows) throw new Error('ECharts setOption failed');
    }, []);
    if (dialog.chartThrows && dialog.chartFailurePhase === 'render') {
      throw new Error('ECharts runtime preparation failed');
    }
    return <div>Rendered chart</div>;
  },
}));
vi.mock('../registry/nocobase-ai/components/chat/tool-call-utils.js', () => ({
  getNocoBaseToolCallMetadata: (part: {
    callProviderMetadata?: { nocobase?: unknown };
  }) => part.callProviderMetadata?.nocobase,
}));
// The Registry translates in the plugin's namespace; a strict runtime fails on a key its locale files lack.
const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-ai-employee': locales },
});
const I18n = ({ children }: { readonly children: ReactNode }) => (
  <TestI18nProvider
    runtime={runtime}
    namespace='@nocobase/app-plugin-ai-employee'
  >
    {children}
  </TestI18nProvider>
);
const renderWithI18n = (ui: Parameters<typeof render>[0]) =>
  render(ui, { wrapper: I18n });

const service = new BusinessReportService();
const success = () =>
  service.generate({
    title: ' Server title ',
    markdown: 'Validated body',
    fileName: 'April:Revenue',
  });
const props = (part: Record<string, unknown>): AIToolRendererProps => ({
  part: {
    type: 'dynamic-tool',
    toolName: 'businessReportGenerator',
    toolCallId: 'report-1',
    input: {
      title: 'Untrusted input',
      markdown: 'Unvalidated body',
      charts: '[]',
    },
    ...part,
  } as AIToolRendererProps['part'],
  disabled: false,
  onApprove: vi.fn(),
  onEdit: vi.fn(),
  onReject: vi.fn(),
  onRevise: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  dialog.real = false;
  dialog.chartThrows = false;
});

describe('business report output contract', () => {
  it('reads successful normalized content from live and persisted result forms', () => {
    const result = success();
    expect(result.success).toBe(true);
    for (const output of [
      result,
      JSON.stringify(result),
      { status: 'success', content: result },
    ]) {
      expect(getValidatedBusinessReport(output)).toMatchObject({
        title: 'Server title',
        markdown: 'Validated body',
        fileName: 'April-Revenue',
        charts: [],
      });
    }
  });

  it.each([
    undefined,
    'Ok',
    {},
    { success: true },
    { status: 'error', content: success() },
    { ...success(), success: false },
    { ...success(), chartCount: 1 },
    { ...success(), errors: ['Invalid chart'] },
    {
      ...success(),
      report: { title: 'Report', markdown: 'Body', charts: '[]' },
    },
    {
      ...success(),
      chartCount: 1,
      report: { title: 'Report', markdown: 'Body', charts: [{ options: {} }] },
    },
  ])('fails closed instead of reparsing raw chart inputs: %j', (output) => {
    expect(getValidatedBusinessReport(output)).toBeUndefined();
  });

  it.each([
    { title: { link: 'javascript:alert(1)' } },
    {
      series: [
        {
          type: 'treemap',
          data: [{ children: [{ link: 'https://example.com' }] }],
        },
      ],
    },
    {
      title: {
        textStyle: {
          backgroundColor: { image: 'https://example.com/pixel.png' },
        },
      },
    },
    { symbol: 'image://data:image/svg+xml,<svg/>' },
    { tooltip: { formatter: () => 'unsafe' } },
  ])(
    'rejects unsafe chart options in older persisted success results: %j',
    (options) => {
      expect(
        getValidatedBusinessReport({
          success: true,
          errors: [],
          warnings: [],
          chartCount: 1,
          report: {
            title: 'Old report',
            markdown: '',
            charts: [
              { options: { series: [{ type: 'pie', data: [1] }], ...options } },
            ],
          },
        }),
      ).toBeUndefined();
    },
  );

  it('rejects a failed chart export instead of returning a successful partial report', async () => {
    const result = service.generate({
      title: 'Report',
      charts: [{ options: { series: { type: 'pie', data: [1] } } }],
    });
    const report = getValidatedBusinessReport(result)!;
    await expect(buildBusinessReportHtml(report)).rejects.toThrow(
      'ECharts setOption failed',
    );
    expect(exportRuntime.dispose).toHaveBeenCalledOnce();
    expect(document.querySelector('[style*="-100000px"]')).toBeNull();
  });

  it('uses normalized placeholders and preserves chart data containing closing tags', () => {
    const result = service.generate({
      title: 'Report',
      markdown: '{{ Chart : 1 }}',
      charts: [
        {
          options: {
            series: {
              type: 'pie',
              data: [{ name: '</echarts><echarts>{}</echarts>', value: 1 }],
            },
          },
        },
      ],
    });
    const report = getValidatedBusinessReport(result)!;
    const markdown = buildBusinessReportMarkdown(report);
    const charts = splitBusinessReportMarkdown(markdown).filter(
      (part) => part.type === 'chart',
    );
    expect(charts).toHaveLength(1);
    expect(charts[0]).toMatchObject({ options: report.charts[0].options });
    expect(markdown).not.toContain('{{chart:');
  });
});

describe('BusinessReportRenderer', () => {
  it('opens only normalized successful output, including Markdown-only reports', () => {
    renderWithI18n(
      <BusinessReportRenderer
        {...props({ state: 'output-available', output: success() })}
      />,
    );
    expect(screen.getByRole('button')).toBeEnabled();
    expect(screen.getByText('Server title')).toBeInTheDocument();
    expect(screen.queryByText('Untrusted input')).not.toBeInTheDocument();
    expect(screen.getByText('0 charts')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(dialog.open).toHaveBeenCalledWith(
      'report-1',
      expect.objectContaining({
        title: 'Server title',
        markdown: 'Validated body',
        fileName: 'April-Revenue',
      }),
      true,
    );
  });

  it.each([
    {
      state: 'output-available',
      output: {
        success: false,
        chartCount: 0,
        errors: ['Invalid chart'],
        warnings: [],
      },
    },
    { state: 'output-available', output: 'Ok' },
    { state: 'output-error', errorText: 'Invalid chart' },
    {
      state: 'output-available',
      output: success(),
      callProviderMetadata: {
        nocobase: { status: 'error', invokeStatus: 'done' },
      },
    },
    {
      state: 'input-available',
      callProviderMetadata: {
        nocobase: { status: 'success', invokeStatus: 'done' },
      },
    },
    {
      state: 'input-available',
      callProviderMetadata: { nocobase: { invokeStatus: 'rejected' } },
    },
  ])('never shows failed or missing output as successful: %j', (part) => {
    renderWithI18n(<BusinessReportRenderer {...props(part)} />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.queryByText('Preview and export')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('does not show streaming input and auto-opens only after successful validation', () => {
    const { rerender } = renderWithI18n(
      <BusinessReportRenderer {...props({ state: 'input-streaming' })} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Untrusted input')).not.toBeInTheDocument();
    rerender(
      <BusinessReportRenderer
        {...props({ state: 'output-available', output: success() })}
      />,
    );
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it.each(['render', 'mount'] as const)(
    'contains chart %s failures, clears success UI, and recovers for corrected output',
    async (phase) => {
      dialog.real = true;
      dialog.chartThrows = true;
      dialog.chartFailurePhase = phase;
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const output = service.generate({
        title: 'Chart report',
        charts: [{ options: { series: { type: 'pie', data: [1] } } }],
      });
      const tree = (result: unknown) => (
        <BusinessReportDialogProvider>
          <BusinessReportRenderer
            {...props({ state: 'output-available', output: result })}
          />
        </BusinessReportDialogProvider>
      );
      try {
        const { rerender } = renderWithI18n(tree(output));
        fireEvent.click(screen.getByRole('button', { name: /Chart report/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Report chart rendering failed',
        );
        await waitFor(() =>
          expect(
            screen.queryByText('Preview and export'),
          ).not.toBeInTheDocument(),
        );
        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.queryByText('Rendered chart')).not.toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Download HTML' }),
        ).toBeDisabled();
        expect(
          screen.getByRole('button', { name: 'Print PDF' }),
        ).toBeDisabled();
        dialog.chartThrows = false;
        rerender(
          tree(
            service.generate({
              title: 'Corrected report',
              charts: [{ options: { series: { type: 'pie', data: [2] } } }],
            }),
          ),
        );
        expect(await screen.findByText('Rendered chart')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Preview and export')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Download HTML' }),
        ).toBeEnabled();
      } finally {
        consoleError.mockRestore();
      }
    },
  );

  it('does not auto-open a failed report after generation', () => {
    const { rerender } = renderWithI18n(
      <BusinessReportRenderer {...props({ state: 'input-available' })} />,
    );
    rerender(
      <BusinessReportRenderer
        {...props({
          state: 'output-available',
          output: service.generate({ title: 'Invalid' }),
        })}
      />,
    );
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
