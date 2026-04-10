/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, Space, Tag, Typography } from 'antd';
import { BarChartOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { css, keyframes } from '@emotion/css';
import { ToolsUIProperties, useToken } from '@nocobase/client';
import { useT } from '../../../locale';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatToolsStore } from '../../chatbox/stores/chat-tools';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { BusinessReport, BusinessReportRenderState } from './report-utils';

class BoundedSet<T> {
  private readonly items = new Set<T>();

  constructor(private readonly maxSize: number) {}

  has(value: T) {
    return this.items.has(value);
  }

  add(value: T) {
    if (this.items.has(value)) {
      return this;
    }

    if (this.items.size >= this.maxSize) {
      const oldestValue = this.items.values().next().value as T | undefined;
      if (oldestValue !== undefined) {
        this.items.delete(oldestValue);
      }
    }

    this.items.add(value);
    return this;
  }
}

const autoOpenedToolIds = new BoundedSet<string>(200);
const loadingBar = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(220%);
  }
`;

export const BusinessReportCard: React.FC<ToolsUIProperties<BusinessReport>> = ({ messageId, toolCall }) => {
  const t = useT();
  const { token } = useToken();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const messages = useChatMessagesStore.use.messages();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  const setOpen = useChatToolsStore.use.setOpenToolModal();
  const setActiveTool = useChatToolsStore.use.setActiveTool();
  const setActiveMessageId = useChatToolsStore.use.setActiveMessageId();
  const report = useMemo<Partial<BusinessReportRenderState>>(
    () => (toolCall.args as BusinessReport) || {},
    [toolCall.args],
  );
  const isGenerating = !['done', 'confirmed'].includes(toolCall.invokeStatus);
  const isReady = toolCall.status === 'success' && ['done', 'confirmed'].includes(toolCall.invokeStatus);
  const latestMessageId = messages[messages.length - 1]?.content?.messageId;
  const hasLiveContent = !!(report?.title || report?.summary || report?.markdown?.trim() || report?.charts?.length);
  const lastStableContentRef = useRef<Partial<BusinessReport>>({});

  const loadingBarClass = useMemo(
    () =>
      css({
        position: 'relative',
        overflow: 'hidden',
        height: 4,
        borderRadius: 999,
        background: token.colorFillSecondary,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          width: '45%',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${token.colorPrimaryBg} 0%, ${token.colorPrimary} 100%)`,
          animation: `${loadingBar} 1.2s ease-in-out infinite`,
        },
      }),
    [token.colorFillSecondary, token.colorPrimary, token.colorPrimaryBg],
  );

  const openModal = useCallback(() => {
    setActiveTool(toolCall);
    setActiveMessageId(messageId);
    setOpen(true);
  }, [messageId, setActiveMessageId, setActiveTool, setOpen, toolCall]);

  useEffect(() => {
    if (!responseLoading || latestMessageId !== messageId) {
      return;
    }
    if (!(toolCall.status === 'success' && toolCall.invokeStatus === 'done')) {
      return;
    }
    const autoOpenKey = `${currentConversation || 'global'}:${toolCall.id}`;
    if (autoOpenedToolIds.has(autoOpenKey)) {
      return;
    }
    autoOpenedToolIds.add(autoOpenKey);
    openModal();
  }, [
    currentConversation,
    latestMessageId,
    messageId,
    openModal,
    responseLoading,
    toolCall.id,
    toolCall.status,
    toolCall.invokeStatus,
  ]);

  useEffect(() => {
    if (!hasLiveContent) {
      return;
    }
    lastStableContentRef.current = {
      ...lastStableContentRef.current,
      ...report,
      charts: report?.charts || lastStableContentRef.current.charts,
    };
  }, [hasLiveContent, report]);

  const displayReport: Partial<BusinessReportRenderState> = hasLiveContent ? report : lastStableContentRef.current;

  const summary =
    displayReport?.summary ||
    (displayReport?.markdown?.trim()
      ? displayReport.markdown.trim().split('\n').filter(Boolean).slice(0, 2).join(' ')
      : isGenerating
        ? t('Generating business analysis report...')
        : t('Open the report to preview, export, or print it.'));
  const markdownPreview = displayReport?.markdown?.trim()?.split('\n').filter(Boolean).slice(0, 3).join(' ') || '';
  const title = displayReport?.title || t('Business analysis report');

  return (
    <Card
      hoverable={isReady}
      style={{ margin: '16px 0', cursor: isReady ? 'pointer' : isGenerating ? 'progress' : 'default' }}
      onClick={() => {
        if (!isReady) {
          return;
        }
        openModal();
      }}
    >
      <Card.Meta
        avatar={isGenerating ? <LoadingOutlined spin /> : <FileTextOutlined />}
        title={title}
        description={
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <div>{summary}</div>
            {markdownPreview ? (
              <Typography.Paragraph
                ellipsis={{ rows: 3, expandable: false }}
                style={{ marginBottom: 0, color: token.colorTextSecondary }}
              >
                {markdownPreview}
              </Typography.Paragraph>
            ) : null}
            <Space wrap size={[8, 8]}>
              <Tag bordered={false} color={isGenerating ? 'warning' : 'processing'}>
                {isGenerating ? t('Generating') : t('Markdown')}
              </Tag>
              <Tag bordered={false} color={isReady ? 'success' : 'default'}>
                {(displayReport?.charts || []).length} {t('Charts')}
              </Tag>
              <Tag
                bordered={false}
                style={{
                  background: token.colorFillTertiary,
                  color: token.colorTextSecondary,
                }}
              >
                <BarChartOutlined /> {t('Preview and export')}
              </Tag>
            </Space>
            {isGenerating ? <div className={loadingBarClass} /> : null}
          </Space>
        }
      />
    </Card>
  );
};
