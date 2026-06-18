/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Alert, App, Button, Result, Space, Spin, Tabs, theme, Typography } from 'antd';
import { FileMarkdownOutlined, FilePdfOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ToolCall } from '@nocobase/client-v2';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { Markdown } from '../chatbox/components/Markdown';
import {
  buildReportHtml,
  buildReportMarkdown,
  BusinessReport,
  BusinessReportRenderState,
  downloadTextFile,
  getReportFileName,
  normalizeBusinessReport,
  printReport,
} from './business-report-utils';

const getReportPanelHeight = (token: ReturnType<typeof theme.useToken>['token']) =>
  `calc(100vh - ${token.controlHeightLG + token.marginXXL * 6}px)`;

class BusinessReportErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: (error: Error) => React.ReactNode;
    resetKey: string;
  },
  { error: Error | null; resetKey: string }
> {
  state: { error: Error | null; resetKey: string } = {
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { error: Error | null; resetKey: string }) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

type BusinessReportModalState = {
  displayReport: Partial<BusinessReportRenderState>;
  isGenerating: boolean;
  markdown: string;
  fileName: string;
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

function useBusinessReportState(tool: ToolCall<BusinessReport>): BusinessReportModalState {
  const t = useT();
  const app = useApp();
  const locale = app.apiClient.auth.getLocale();
  const report = useMemo(
    () =>
      normalizeBusinessReport({
        ...(tool?.args as BusinessReport),
        generatedAt: tool?.invokeEndTime as BusinessReportRenderState['generatedAt'],
      }),
    [tool?.args, tool?.invokeEndTime],
  );
  const isGenerating = !['done', 'confirmed'].includes(tool.invokeStatus);
  const hasRenderableContent = !!(report?.title || report?.summary || report?.markdown);
  const title = report?.title || t('Business analysis report');
  const markdown = useMemo(
    () => buildReportMarkdown(report, { locale: typeof locale === 'string' ? locale : undefined, t }),
    [locale, report, t],
  );
  const fileName = useMemo(() => getReportFileName(report), [report]);
  const stableReport = useMemo(
    () =>
      isGenerating
        ? {
            ...report,
            charts: [],
          }
        : report,
    [isGenerating, report],
  );
  const previewMessage = useMemo(
    () => ({
      content: stableReport?.markdown
        ? buildReportMarkdown(stableReport, { locale: typeof locale === 'string' ? locale : undefined, t })
        : `# ${title}\n\n${report?.summary || t('Generating business analysis report...')}`,
      type: 'text' as const,
      messageId: tool.id,
    }),
    [locale, report?.summary, stableReport, t, title, tool.id],
  );

  if (!hasRenderableContent && isGenerating) {
    return {
      displayReport: report,
      isGenerating,
      markdown,
      fileName,
      previewMessage,
      title,
      locale: typeof locale === 'string' ? locale : undefined,
      invalid: false,
      loading: true,
    };
  }

  return {
    displayReport: report,
    isGenerating,
    markdown,
    fileName,
    previewMessage,
    title,
    locale: typeof locale === 'string' ? locale : undefined,
    invalid: !report?.title && !report?.markdown && !isGenerating,
    loading: false,
  };
}

const BusinessReportModalContent: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  const t = useT();
  const { token } = theme.useToken();
  const state = useBusinessReportState(tool);
  const { previewMessage, displayReport, isGenerating, title, invalid, loading, markdown } = state;
  const reportPanelHeight = getReportPanelHeight(token);
  const htmlPreview = useMemo(
    () => buildReportHtml(displayReport, { locale: state.locale, t }),
    [displayReport, state.locale, t],
  );

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
          <Typography.Title level={4} style={{ marginBottom: token.marginXXS }}>
            {title}
            {isGenerating ? (
              <Spin indicator={<LoadingOutlined spin />} size="small" style={{ marginLeft: token.marginSM }} />
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
        style={{ height: reportPanelHeight }}
        tabBarStyle={{ marginBottom: token.marginSM }}
        items={[
          {
            key: 'preview',
            label: t('Preview'),
            children: (
              <div
                style={{
                  height: reportPanelHeight,
                  overflow: 'auto',
                  padding: token.padding,
                  border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusLG,
                  background: token.colorBgContainer,
                  color: token.colorText,
                  boxShadow: `inset 0 ${token.lineWidth}px 0 ${token.colorFillQuaternary}`,
                }}
              >
                <Markdown message={previewMessage}>{previewMessage.content}</Markdown>
              </div>
            ),
          },
          {
            key: 'markdown',
            label: t('Markdown'),
            children: (
              <pre
                style={{
                  height: reportPanelHeight,
                  overflow: 'auto',
                  padding: token.padding,
                  borderRadius: token.borderRadiusLG,
                  background: token.colorText,
                  color: token.colorBgContainer,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {markdown || t('Generating business analysis report...')}
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
                  height: reportPanelHeight,
                  border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
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
  const app = useApp();
  const { message } = App.useApp();
  const locale = app.apiClient.auth.getLocale();
  const report = useMemo(
    () =>
      normalizeBusinessReport({
        ...(tool?.args as BusinessReport),
        generatedAt: tool?.invokeEndTime as BusinessReportRenderState['generatedAt'],
      }),
    [tool?.args, tool?.invokeEndTime],
  );
  const isGenerating = !['done', 'confirmed'].includes(tool.invokeStatus);
  const markdown = useMemo(
    () => buildReportMarkdown(report, { locale: typeof locale === 'string' ? locale : undefined, t }),
    [locale, report, t],
  );
  const fileName = useMemo(() => getReportFileName(report), [report]);
  const [exporting, setExporting] = useState(false);
  const hasMarkdown = !!report?.markdown;

  return (
    <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
      <Button
        icon={<FileMarkdownOutlined />}
        disabled={isGenerating || !hasMarkdown}
        onClick={() => downloadTextFile(`${fileName}.md`, markdown, 'text/markdown;charset=utf-8')}
      >
        {t('Download Markdown')}
      </Button>
      <Button
        icon={<FileTextOutlined />}
        disabled={isGenerating || !hasMarkdown || exporting}
        onClick={() => {
          setExporting(true);
          try {
            const html = buildReportHtml(report, { locale: typeof locale === 'string' ? locale : undefined, t });
            downloadTextFile(`${fileName}.html`, html, 'text/html;charset=utf-8');
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
        disabled={isGenerating || !hasMarkdown || exporting}
        onClick={async () => {
          setExporting(true);
          try {
            if (!(await printReport(report, { locale: typeof locale === 'string' ? locale : undefined, t }))) {
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

export const BusinessReportModal: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  const t = useT();
  const resetKey = `${tool.id}:${tool.invokeStatus}:${JSON.stringify(tool.args)}`;
  return (
    <BusinessReportErrorBoundary
      resetKey={resetKey}
      fallback={(error) => (
        <Alert type="error" showIcon message={t('Invalid report definition')} description={error.message} />
      )}
    >
      <BusinessReportModalContent tool={tool} />
    </BusinessReportErrorBoundary>
  );
};

BusinessReportModal.displayName = 'BusinessReportModal';
BusinessReportModalFooter.displayName = 'BusinessReportModalFooter';
