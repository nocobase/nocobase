/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Result, Space, Spin, Tabs, Typography } from 'antd';
import { FileMarkdownOutlined, FilePdfOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { ToolCall, useAPIClient, useToken } from '@nocobase/client';
import { ErrorBoundary } from 'react-error-boundary';
import { useT } from '../../../locale';
import { Markdown } from '../../chatbox/markdown/Markdown';
import {
  buildReportHtml,
  buildReportMarkdown,
  BusinessReport,
  BusinessReportRenderState,
  downloadTextFile,
  getReportFileName,
  printReport,
} from './report-utils';

const REPORT_PANEL_HEIGHT = 'calc(100vh - 420px)';

type BusinessReportModalState = {
  t: ReturnType<typeof useT>;
  token: ReturnType<typeof useToken>['token'];
  displayReport: BusinessReportRenderState;
  isGenerating: boolean;
  markdown: string;
  fileName: string;
  htmlPreview: string;
  previewMessage: {
    content: string;
    type: 'text';
    messageId: string;
  };
  title: string;
  locale?: string;
  invalid: boolean;
  loading: boolean;
};

function useBusinessReportState(tool: ToolCall<BusinessReport>) {
  const t = useT();
  const { token } = useToken();
  const api = useAPIClient();
  const locale = api.auth.getLocale();
  const report = useMemo(
    () =>
      ({
        ...(tool?.args as BusinessReport),
        generatedAt: tool?.invokeEndTime,
      }) as BusinessReportRenderState,
    [tool?.args, tool?.invokeEndTime],
  );
  const reportSignature = useMemo(
    () =>
      JSON.stringify({
        title: report?.title || '',
        summary: report?.summary || '',
        markdown: report?.markdown || '',
        charts: report?.charts || [],
        generatedAt: report?.generatedAt || null,
      }),
    [report],
  );
  const isGenerating = !['done', 'confirmed'].includes(tool.invokeStatus);
  const hasRenderableContent = !!(report?.title || report?.summary || report?.markdown);
  const [snapshot, setSnapshot] = useState<BusinessReportRenderState | null>(null);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [snapshotSignature, setSnapshotSignature] = useState<string | null>(null);

  useEffect(() => {
    setSnapshot(null);
    setSnapshotSignature(null);
  }, [tool.id]);

  useEffect(() => {
    if (
      tool.status === 'success' &&
      tool.invokeStatus === 'done' &&
      hasRenderableContent &&
      reportSignature !== snapshotSignature
    ) {
      setSnapshot(report);
      setSnapshotSignature(reportSignature);
    }
  }, [hasRenderableContent, report, reportSignature, snapshotSignature, tool.invokeStatus, tool.status]);

  const displayReport = snapshot || report;
  const displayReportSignature = snapshot ? snapshotSignature || reportSignature : reportSignature;
  const title = displayReport?.title || t('Business analysis report');
  const stableReport = useMemo<BusinessReportRenderState>(
    () =>
      isGenerating
        ? {
            ...displayReport,
            charts: [],
          }
        : displayReport,
    [displayReport, isGenerating],
  );
  const markdown = useMemo(() => buildReportMarkdown(displayReport, { locale }), [displayReportSignature, locale]);
  const fileName = useMemo(() => getReportFileName(displayReport), [displayReport]);
  const previewMessage = useMemo(
    () => ({
      content: stableReport?.markdown
        ? buildReportMarkdown(stableReport, { locale })
        : `# ${title}\n\n${displayReport?.summary || t('Generating business analysis report...')}`,
      type: 'text' as const,
      messageId: tool.id,
    }),
    [displayReport?.summary, displayReportSignature, locale, stableReport, t, title, tool.id],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!displayReport?.markdown || isGenerating) {
        setHtmlPreview('');
        return;
      }

      try {
        const previewHtml = await buildReportHtml(displayReport, { locale });
        if (cancelled) {
          return;
        }
        setHtmlPreview((prev) => (prev === previewHtml ? prev : previewHtml));
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to build business report HTML:', error);
          setHtmlPreview('');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [displayReportSignature, isGenerating, locale]);

  const baseState: BusinessReportModalState = {
    t,
    token,
    displayReport,
    isGenerating,
    markdown,
    fileName,
    htmlPreview,
    previewMessage,
    title,
    locale: typeof locale === 'string' ? locale : undefined,
    invalid: false,
    loading: false,
  };

  if (!hasRenderableContent && isGenerating) {
    return {
      ...baseState,
      loading: true,
    };
  }

  if (!displayReport?.title && !displayReport?.markdown && !isGenerating) {
    return {
      ...baseState,
      invalid: true,
    };
  }

  return baseState;
}

const BusinessReportModalContent: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  const state = useBusinessReportState(tool);
  const { t, token, previewMessage, htmlPreview, displayReport, isGenerating, title, invalid, loading } = state;

  if (loading) {
    return (
      <Result
        icon={<LoadingOutlined spin />}
        title={t('Generating business analysis report...')}
        subTitle={t('The report modal will update in real time as new content arrives.')}
      />
    );
  }

  if (invalid) {
    return <Alert type="error" showIcon message={t('Invalid report definition')} />;
  }

  return (
    <div>
      <div>
        <div style={{ paddingRight: token.paddingSM }}>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            {title}
            {isGenerating ? (
              <Spin indicator={<LoadingOutlined spin />} size="small" style={{ marginLeft: 12 }} />
            ) : null}
          </Typography.Title>
          {displayReport.summary ? (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {displayReport.summary}
            </Typography.Paragraph>
          ) : isGenerating ? (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('The report modal will update in real time as new content arrives.')}
            </Typography.Paragraph>
          ) : null}
        </div>
      </div>
      <Tabs
        style={{ height: REPORT_PANEL_HEIGHT }}
        tabBarStyle={{ marginBottom: token.marginSM }}
        items={[
          {
            key: 'preview',
            label: t('Preview'),
            children: (
              <div
                style={{
                  height: REPORT_PANEL_HEIGHT,
                  overflow: 'auto',
                  padding: 16,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                  background: token.colorBgContainer,
                  color: token.colorText,
                  boxShadow: `inset 0 1px 0 ${token.colorFillQuaternary}`,
                }}
              >
                <Markdown message={previewMessage} />
              </div>
            ),
          },
          {
            key: 'markdown',
            label: t('Markdown'),
            children: (
              <pre
                style={{
                  height: REPORT_PANEL_HEIGHT,
                  overflow: 'auto',
                  padding: 16,
                  borderRadius: 12,
                  background: '#0f172a',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {displayReport?.markdown || t('Generating business analysis report...')}
              </pre>
            ),
          },
          {
            key: 'html',
            label: t('HTML'),
            children: htmlPreview ? (
              <iframe
                title={title}
                srcDoc={htmlPreview}
                style={{
                  width: '100%',
                  height: REPORT_PANEL_HEIGHT,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                  background: token.colorBgContainer,
                }}
              />
            ) : (
              <Result icon={<LoadingOutlined spin />} title={t('Generating business analysis report...')} />
            ),
          },
        ]}
      />
    </div>
  );
};

export const BusinessReportModalFooter: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  const t = useT();
  const { message } = App.useApp();
  const api = useAPIClient();
  const locale = api.auth.getLocale();
  const report = useMemo(
    () =>
      ({
        ...(tool?.args as BusinessReport),
        generatedAt: tool?.invokeEndTime,
      }) as BusinessReportRenderState,
    [tool?.args, tool?.invokeEndTime],
  );
  const isGenerating = !['done', 'confirmed'].includes(tool.invokeStatus);
  const markdown = useMemo(() => buildReportMarkdown(report, { locale }), [report, locale]);
  const fileName = useMemo(() => getReportFileName(report), [report]);
  const [exporting, setExporting] = useState(false);

  return (
    <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
      <Button
        icon={<FileMarkdownOutlined />}
        disabled={isGenerating || !report?.markdown}
        onClick={() => downloadTextFile(`${fileName}.md`, markdown, 'text/markdown;charset=utf-8')}
      >
        {t('Download Markdown')}
      </Button>
      <Button
        icon={<FileTextOutlined />}
        disabled={isGenerating || !report?.markdown || exporting}
        onClick={async () => {
          setExporting(true);
          try {
            const printableHtml = await buildReportHtml(report, { printMode: true, locale });
            downloadTextFile(`${fileName}.html`, printableHtml, 'text/html;charset=utf-8');
          } finally {
            setExporting(false);
          }
        }}
      >
        {t('Download HTML')}
      </Button>
      <Button
        type="primary"
        icon={<FilePdfOutlined />}
        loading={exporting}
        disabled={isGenerating || !report?.markdown || exporting}
        onClick={async () => {
          setExporting(true);
          try {
            if (!(await printReport(report, { locale }))) {
              message.error(t('Popup blocked. Please allow popups and try again.'));
            }
          } catch (error) {
            console.error('Failed to print business report:', error);
            message.error(t('Popup blocked. Please allow popups and try again.'));
          } finally {
            setExporting(false);
          }
        }}
      >
        {t('Print PDF')}
      </Button>
    </Space>
  );
};

const BusinessReportModalFallback: React.FC<{ error: Error }> = ({ error }) => {
  const t = useT();
  return <Alert type="error" showIcon message={t('Invalid report definition')} description={error.message} />;
};

export const BusinessReportModal: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  return (
    <ErrorBoundary
      FallbackComponent={BusinessReportModalFallback}
      onError={(error) => console.error('Business report modal render error:', error, tool)}
      resetKeys={[tool.id, tool.invokeStatus, tool.args]}
    >
      <BusinessReportModalContent tool={tool} />
    </ErrorBoundary>
  );
};
