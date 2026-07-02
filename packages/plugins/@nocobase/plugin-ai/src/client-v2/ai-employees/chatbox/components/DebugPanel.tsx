/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Empty, Input, List, Select, Space, Tag, Tooltip, Typography, message, theme } from 'antd';
import { CopyOutlined, DownloadOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { aiDebugLogger, type LogEntry, type LogType } from '../../../debug-logger';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';

const { Search } = Input;
const { Text } = Typography;

const LOG_TYPE_COLORS: Record<LogType, string> = {
  request: 'blue',
  stream_text: 'green',
  stream_search: 'cyan',
  stream_start: 'geekblue',
  stream_tools: 'orange',
  stream_delta: 'lime',
  stream_reasoning: 'magenta',
  stream_error: 'volcano',
  tool_call: 'gold',
  tool_result: 'purple',
  error: 'red',
};

const LOG_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'request', label: 'Request' },
  { value: 'stream_text', label: 'Stream Text' },
  { value: 'stream_search', label: 'Stream Search' },
  { value: 'stream_start', label: 'Stream Start' },
  { value: 'stream_tools', label: 'Stream Tools' },
  { value: 'stream_delta', label: 'Stream Delta' },
  { value: 'stream_reasoning', label: 'Stream Reasoning' },
  { value: 'stream_error', label: 'Stream Error' },
  { value: 'tool_call', label: 'Tool Call' },
  { value: 'tool_result', label: 'Tool Result' },
  { value: 'error', label: 'Error' },
];

export const DebugPanel: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const showDebugPanel = useChatBoxStore.use.showDebugPanel();
  const setShowDebugPanel = useChatBoxStore.use.setShowDebugPanel();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentConversation) {
      setLogs([]);
      return;
    }
    const session = aiDebugLogger.getSession(currentConversation);
    setLogs(session ? [...session.logs] : []);

    return aiDebugLogger.subscribe((log, sessionId) => {
      if (sessionId === currentConversation) {
        setLogs((previous) => [...previous, log]);
      }
    });
  }, [currentConversation]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== 'all' && log.type !== filterType) {
        return false;
      }
      if (!searchText) {
        return true;
      }
      return JSON.stringify(log.data).toLowerCase().includes(searchText.toLowerCase());
    });
  }, [filterType, logs, searchText]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExport = () => {
    if (!currentConversation || logs.length === 0) {
      return;
    }
    const session = aiDebugLogger.getSession(currentConversation);
    const exportData = {
      sessionId: currentConversation,
      employeeId: session?.employeeId,
      employeeName: session?.employeeName,
      exportedAt: new Date().toISOString(),
      logs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const name = session?.employeeName || 'unknown';
    anchor.download = `ai-chat-log-${name}-${new Date().toISOString().slice(0, 16).replace('T', '_')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Drawer
      title={
        <Space>
          <span>{t('Debug Panel')}</span>
          {currentConversation ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({logs.length} logs)
            </Text>
          ) : null}
        </Space>
      }
      placement="right"
      width={500}
      open={showDebugPanel}
      onClose={() => setShowDebugPanel(false)}
      styles={{ body: { padding: 0, overflow: 'hidden' } }}
      extra={
        <Button icon={<DownloadOutlined />} size="small" onClick={handleExport} disabled={logs.length === 0}>
          {t('Export')}
        </Button>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: `1px solid ${token.colorBorder}`,
            display: 'flex',
            gap: 8,
          }}
        >
          <Select
            value={filterType}
            onChange={setFilterType}
            options={LOG_TYPE_OPTIONS}
            style={{ width: 120 }}
            size="small"
          />
          <Search
            placeholder={t('Search logs...')}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            size="small"
            style={{ flex: 1 }}
          />
        </div>
        {!currentConversation ? (
          <Empty description={t('No conversation selected')} style={{ marginTop: 100 }} />
        ) : filteredLogs.length === 0 ? (
          <Empty description={t('No logs')} style={{ marginTop: 100 }} />
        ) : (
          <List
            dataSource={filteredLogs}
            rowKey={(item) => item.id}
            style={{
              overflow: 'auto',
              flex: 1,
            }}
            renderItem={(log) => (
              <LogItem log={log} expanded={expandedIds.has(log.id)} onToggleExpand={() => toggleExpand(log.id)} />
            )}
          />
        )}
      </div>
    </Drawer>
  );
};

const LogItem: React.FC<{
  log: LogEntry;
  expanded: boolean;
  onToggleExpand: () => void;
}> = ({ log, expanded, onToggleExpand }) => {
  const { token } = theme.useToken();
  const preview = getPreview(log.data);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(JSON.stringify(log.data, null, 2))
      .then(() => message.success('Copied to clipboard'))
      .catch(() => message.error('Failed to copy'));
  };

  return (
    <List.Item
      style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
          onClick={onToggleExpand}
        >
          {expanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {formatTime(log.time)}
          </Text>
          <Tag color={LOG_TYPE_COLORS[log.type]} style={{ margin: 0 }}>
            {log.type}
          </Tag>
          <Text ellipsis style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, color: token.colorTextSecondary }}>
            {preview}
          </Text>
          <Tooltip title="Copy">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                handleCopy();
              }}
            />
          </Tooltip>
        </div>
        {expanded ? (
          <pre
            style={{
              margin: '8px 0 0 18px',
              padding: 8,
              backgroundColor: token.colorFillSecondary,
              borderRadius: 4,
              fontSize: 12,
              overflowX: 'auto',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {JSON.stringify(log.data, null, 2)}
          </pre>
        ) : null}
      </div>
    </List.Item>
  );
};

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}.${milliseconds}`;
}

function getPreview(data: Record<string, unknown>) {
  try {
    const text = JSON.stringify(data);
    return text.length > 100 ? `${text.slice(0, 100)}...` : text;
  } catch {
    return '[Unable to stringify]';
  }
}
