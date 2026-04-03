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
import { ToolCall, useToken } from '@nocobase/client';
import { ErrorBoundary } from 'react-error-boundary';
import { useT } from '../../../locale';
import { Markdown } from '../../chatbox/markdown/Markdown';
import {
  buildReportHtml,
  buildReportMarkdown,
  BusinessReport,
  downloadTextFile,
  getReportFileName,
  printReport,
} from './report-utils';

const BusinessReportModalContent: React.FC<{ tool: ToolCall<BusinessReport> }> = ({ tool }) => {
  const t = useT();
  const { message } = App.useApp();
  const { token } = useToken();
  const report = useMemo(
    () =>
      ({
        ...(tool?.args as BusinessReport),
        generatedAt: (tool?.args as BusinessReport)?.generatedAt || tool?.invokeEndTime,
      }) as BusinessReport,
    [tool?.args, tool?.invokeEndTime],
  );
  const isGenerating = !['done', 'confirmed'].includes(tool.invokeStatus);
  const hasRenderableContent = !!(report?.title || report?.summary || report?.markdown);
  const [snapshot, setSnapshot] = useState<BusinessReport | null>(null);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [printableHtml, setPrintableHtml] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSnapshot(null);
  }, [tool.id]);

  useEffect(() => {
    if (tool.status === 'success' && tool.invokeStatus === 'done' && hasRenderableContent) {
      setSnapshot(report);
    }
  }, [hasRenderableContent, report, tool.invokeStatus, tool.status]);

  const displayReport = snapshot || report;
  const title = displayReport?.title || t('Business analysis report');

  const markdown = useMemo(() => buildReportMarkdown(displayReport), [displayReport]);
  const fileName = useMemo(() => getReportFileName(displayReport), [displayReport]);
  const previewMessage = useMemo(
    () => ({
      content: displayReport?.markdown
        ? markdown
        : `# ${title}\n\n${displayReport?.summary || t('Generating business analysis report...')}`,
      type: 'text' as const,
      messageId: tool.id,
    }),
    [displayReport?.markdown, displayReport?.summary, markdown, t, title, tool.id],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!displayReport?.markdown) {
        setHtmlPreview('');
        setPrintableHtml('');
        return;
      }

      try {
        const [previewHtml, printable] = await Promise.all([
          buildReportHtml(displayReport),
          buildReportHtml(displayReport, { printMode: true }),
        ]);
        if (cancelled) {
          return;
        }
        setHtmlPreview(previewHtml);
        setPrintableHtml(printable);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to build business report HTML:', error);
          setHtmlPreview('');
          setPrintableHtml('');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [displayReport]);

  if (!hasRenderableContent && isGenerating) {
    return (
      <Result
        icon={<LoadingOutlined spin />}
        title={t('Generating business analysis report...')}
        subTitle={t('The report modal will update in real time as new content arrives.')}
      />
    );
  }

  if (!displayReport?.title && !displayReport?.markdown && !isGenerating) {
    return <Alert type="error" showIcon message={t('Invalid report definition')} />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space wrap align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
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
        <Space wrap>
          <Button
            icon={<FileMarkdownOutlined />}
            disabled={isGenerating || !displayReport?.markdown}
            onClick={() => downloadTextFile(`${fileName}.md`, markdown, 'text/markdown;charset=utf-8')}
          >
            {t('Download Markdown')}
          </Button>
          <Button
            icon={<FileTextOutlined />}
            disabled={isGenerating || !displayReport?.markdown || !printableHtml || exporting}
            onClick={() => downloadTextFile(`${fileName}.html`, printableHtml, 'text/html;charset=utf-8')}
          >
            {t('Download HTML')}
          </Button>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            loading={exporting}
            disabled={isGenerating || !displayReport?.markdown || exporting}
            onClick={async () => {
              setExporting(true);
              try {
                if (!(await printReport(displayReport))) {
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
      </Space>
      <Tabs
        items={[
          {
            key: 'preview',
            label: t('Preview'),
            children: (
              <div
                style={{
                  maxHeight: '70vh',
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
                  maxHeight: '70vh',
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
                  height: '70vh',
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
