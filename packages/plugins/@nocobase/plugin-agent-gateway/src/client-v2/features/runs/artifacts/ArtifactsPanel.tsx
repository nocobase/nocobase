/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Collapse, List, Pagination, Space, Spin, Tabs, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import {
  ArtifactContentEntry,
  DetailPageMeta,
  RunArtifactRecord,
  RunSnapshotRecord,
} from '../../../hooks/useRunObservabilityDetails';
import {
  JsonPreview,
  formatDateTime,
  getObjectRecord,
  redactExternalUrlPreviewJson,
  redactPreviewText,
} from '../../../pages/AgentGatewayPageUtils';
import {
  ReadableArtifactItem,
  ReadableArtifactItemKind,
  ReadableArtifactPreview,
  RunRecord,
  TFunction,
} from '../../../pages/runs/types';
import { DETAIL_PAGE_SIZE_OPTIONS, EmptyInline, getStringValue, isRunActionAllowed } from '../runShared';
import { getRunCapability } from '../terminal/TerminalPanel';

export const ARTIFACT_PREVIEW_MAX_ITEMS = 80;

export const ARTIFACT_ITEM_TEXT_MAX_CHARS = 4000;

export const ARTIFACT_RAW_PREVIEW_MAX_CHARS = 24 * 1024;

export const HTML_ARTIFACT_PREVIEW_CSP = [
  "default-src 'none'",
  'img-src data:',
  'font-src data:',
  "style-src 'unsafe-inline'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "connect-src 'none'",
  "media-src 'none'",
  "manifest-src 'none'",
  "worker-src 'none'",
].join('; ');

export const HTML_ARTIFACT_REMOVED_ELEMENTS = [
  'base',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'link',
  'meta',
  'object',
  'portal',
  'script',
  'template',
].join(',');

export const HTML_ARTIFACT_URL_ATTRIBUTES = new Set([
  'action',
  'archive',
  'background',
  'cite',
  'codebase',
  'data',
  'formaction',
  'href',
  'manifest',
  'ping',
  'poster',
  'src',
  'srcset',
  'xlink:href',
]);

export function getArtifactDetailsWarning(run: RunRecord | undefined, t: TFunction) {
  if (!run) {
    return undefined;
  }
  if (!isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'readArtifacts')) {
    return t('Agent Gateway artifact read permission required');
  }
  if (!getRunCapability(run, 'artifacts')) {
    return t('Artifacts are not supported by this provider');
  }
  return undefined;
}

export function truncateArtifactPreviewText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[${'...'} ${text.length - maxChars} chars truncated]`;
}

export function decodeCommonEscapedWhitespace(text: string) {
  const escapedNewlineCount = (text.match(/\\n/g) || []).length;
  const newlineCount = (text.match(/\n/g) || []).length;
  if (escapedNewlineCount < 2 || escapedNewlineCount < newlineCount) {
    return text;
  }
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

export function normalizeArtifactReadableText(text: string, maxChars = ARTIFACT_ITEM_TEXT_MAX_CHARS) {
  return truncateArtifactPreviewText(decodeCommonEscapedWhitespace(redactPreviewText(text) || ''), maxChars);
}

export function getArtifactRawPreview(contentText: string) {
  const rawPreview = truncateArtifactPreviewText(contentText, ARTIFACT_RAW_PREVIEW_MAX_CHARS);
  return {
    rawPreview,
    rawTruncated: rawPreview.length !== contentText.length,
  };
}

export function isAllowedHtmlArtifactDataUrl(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return (
    /^data:image\/(?:avif|bmp|gif|jpe?g|png|webp|x-icon)(?:;|,)/.test(normalizedValue) ||
    /^data:font\/[a-z0-9.+-]+(?:;|,)/.test(normalizedValue) ||
    /^data:application\/(?:font-[a-z0-9.+-]+|vnd\.ms-fontobject|x-font-[a-z0-9.+-]+)(?:;|,)/.test(normalizedValue)
  );
}

export function sanitizeHtmlArtifactCss(cssText: string) {
  return cssText
    .replace(/@import\s+(?:url\s*\([^)]*\)|["'][^"']*["'])[^;]*(?:;|$)/gi, '')
    .replace(/url\s*\(\s*(["']?)(.*?)\1\s*\)/gis, (_match, _quote: string, value: string) => {
      return isAllowedHtmlArtifactDataUrl(value) ? `url("${value.trim().replace(/"/g, '%22')}")` : 'none';
    })
    .replace(/(["'])(?:(?:https?:)?\/\/)[^"']*\1/gi, 'none')
    .replace(/(?:https?:)?\/\/[^\s);}"']+/gi, '');
}

export function escapeHtmlArtifactText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function sanitizeHtmlArtifactPreview(contentText: string) {
  if (typeof DOMParser === 'undefined') {
    return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${escapeHtmlArtifactText(
      HTML_ARTIFACT_PREVIEW_CSP,
    )}"></head><body><pre>${escapeHtmlArtifactText(contentText)}</pre></body></html>`;
  }

  const document = new DOMParser().parseFromString(contentText, 'text/html');
  document.querySelectorAll(HTML_ARTIFACT_REMOVED_ELEMENTS).forEach((element) => element.remove());
  document.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      if (attributeName.startsWith('on') || HTML_ARTIFACT_URL_ATTRIBUTES.has(attributeName)) {
        if (
          element.tagName.toLowerCase() === 'img' &&
          attributeName === 'src' &&
          isAllowedHtmlArtifactDataUrl(attribute.value)
        ) {
          continue;
        }
        element.removeAttribute(attribute.name);
      }
    }

    if (element.hasAttribute('style')) {
      const sanitizedStyle = sanitizeHtmlArtifactCss(element.getAttribute('style') || '').trim();
      if (sanitizedStyle) {
        element.setAttribute('style', sanitizedStyle);
      } else {
        element.removeAttribute('style');
      }
    }

    if (element.tagName.toLowerCase() === 'style') {
      element.textContent = sanitizeHtmlArtifactCss(element.textContent || '');
    }
  });

  const csp = document.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content', HTML_ARTIFACT_PREVIEW_CSP);
  document.head.prepend(csp);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

export function getJsonPreviewText(value: unknown) {
  return normalizeArtifactReadableText(JSON.stringify(redactExternalUrlPreviewJson(value), null, 2));
}

export function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export function parseJsonlArtifact(contentText: string) {
  const lines = contentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return null;
  }

  const values: unknown[] = [];
  let failedCount = 0;
  for (const line of lines) {
    const value = tryParseJson(line);
    if (value === undefined) {
      failedCount += 1;
      continue;
    }
    values.push(value);
  }

  if (values.length < 2 || failedCount > Math.max(2, Math.floor(lines.length * 0.1))) {
    return null;
  }

  return {
    values,
    failedCount,
    totalCount: lines.length,
  };
}

export function getArtifactItemLabel(t: TFunction, kind: ReadableArtifactItemKind, label: string) {
  const colors: Record<ReadableArtifactItemKind, string> = {
    message: 'blue',
    tool: 'purple',
    error: 'red',
    event: 'default',
  };
  const kindLabel: Record<ReadableArtifactItemKind, string> = {
    message: t('Message'),
    tool: t('Tool call'),
    error: t('Error'),
    event: t('Event'),
  };
  return (
    <Space size={8} wrap>
      <Tag color={colors[kind]}>{kindLabel[kind]}</Tag>
      <Typography.Text>{label}</Typography.Text>
    </Space>
  );
}

export function getReadableArtifactItem(value: unknown, index: number, t: TFunction): ReadableArtifactItem | null {
  const record = getObjectRecord(value);
  const type = getStringValue(record.type);
  const item = getObjectRecord(record.item);
  const itemType = getStringValue(item.type);
  const itemId = getStringValue(item.id) || `${index + 1}`;
  const status = getStringValue(item.status);
  const key = `${itemId}-${index}`;

  if (itemType === 'agent_message') {
    const text = getStringValue(item.text);
    if (!text) {
      return null;
    }
    return {
      key,
      kind: 'message',
      label: `${t('Agent message')} #${index + 1}`,
      text: normalizeArtifactReadableText(text),
      defaultOpen: true,
    };
  }

  if (itemType === 'error') {
    const text = getStringValue(item.message) || getJsonPreviewText(value);
    return {
      key,
      kind: 'error',
      label: `${t('Error')} #${index + 1}`,
      text: normalizeArtifactReadableText(text),
      defaultOpen: true,
    };
  }

  if (itemType === 'command_execution') {
    const output = getStringValue(item.aggregated_output);
    const command = getStringValue(item.command);
    if (!output && type === 'item.started') {
      return null;
    }
    return {
      key,
      kind: 'tool',
      label: [t('Tool call'), status, itemId ? `#${itemId}` : null].filter(Boolean).join(' '),
      text: normalizeArtifactReadableText(output || command || t('No tool output')),
      defaultOpen: false,
    };
  }

  if (['thread.started', 'turn.started', 'turn.completed'].includes(type)) {
    return null;
  }

  const text =
    getStringValue(record.message) ||
    getStringValue(record.text) ||
    getStringValue(item.text) ||
    getStringValue(item.message) ||
    getJsonPreviewText(value);
  if (!text) {
    return null;
  }

  return {
    key,
    kind: 'event',
    label: type || `${t('Event')} #${index + 1}`,
    text: normalizeArtifactReadableText(text),
    defaultOpen: false,
  };
}

export function buildReadableArtifactPreview(contentText: string, t: TFunction): ReadableArtifactPreview {
  const { rawPreview, rawTruncated } = getArtifactRawPreview(contentText);
  const jsonl = parseJsonlArtifact(contentText);
  if (jsonl) {
    const items = jsonl.values
      .map((value, index) => getReadableArtifactItem(value, index, t))
      .filter((item): item is ReadableArtifactItem => Boolean(item))
      .slice(0, ARTIFACT_PREVIEW_MAX_ITEMS);
    return {
      mode: 'jsonl',
      summary: `${t('Readable JSONL preview')}: ${items.length}/${jsonl.values.length}`,
      items,
      text: items.length ? '' : normalizeArtifactReadableText(contentText),
      rawPreview,
      rawTruncated,
    };
  }

  const parsedJson = tryParseJson(contentText.trim());
  if (parsedJson !== undefined) {
    return {
      mode: 'json',
      summary: t('Readable JSON preview'),
      items: [],
      text: getJsonPreviewText(parsedJson),
      rawPreview,
      rawTruncated,
    };
  }

  return {
    mode: 'text',
    summary: t('Readable text preview'),
    items: [],
    text: normalizeArtifactReadableText(contentText, ARTIFACT_RAW_PREVIEW_MAX_CHARS),
    rawPreview,
    rawTruncated,
  };
}

export function ArtifactPreviewText({ text }: { text: string }) {
  return (
    <Typography.Paragraph
      style={{
        background: '#f6f8fa',
        border: '1px solid #edf0f2',
        borderRadius: 6,
        margin: 0,
        maxHeight: 360,
        overflow: 'auto',
        padding: 12,
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </Typography.Paragraph>
  );
}

export function ArtifactContentPreview({
  artifact,
  contentText,
  t,
}: {
  artifact: RunArtifactRecord;
  contentText: string | null | undefined;
  t: TFunction;
}) {
  const normalizedContentText = contentText || '';
  const preview = useMemo(() => buildReadableArtifactPreview(normalizedContentText, t), [normalizedContentText, t]);
  if (!normalizedContentText) {
    return <Typography.Text type="secondary">{t('No inline artifact text')}</Typography.Text>;
  }

  if (artifact.mimeType === 'text/html') {
    const sanitizedHtmlPreview = sanitizeHtmlArtifactPreview(preview.rawPreview);
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message={t('Restricted HTML artifact preview')}
          description={t('Scripts, forms, navigation, and external network requests are disabled.')}
        />
        <iframe
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={sanitizedHtmlPreview}
          title={`${artifact.artifactKey || artifact.id}: ${t('Restricted HTML artifact preview')}`}
          style={{
            background: '#fff',
            border: '1px solid #edf0f2',
            borderRadius: 6,
            height: 420,
            width: '100%',
          }}
        />
        <Collapse
          size="small"
          items={[
            {
              key: 'raw',
              label: preview.rawTruncated ? t('Raw artifact text (truncated)') : t('Raw artifact text'),
              children: <ArtifactPreviewText text={preview.rawPreview} />,
            },
          ]}
        />
      </Space>
    );
  }

  if ((artifact.mimeType || '').startsWith('image/') && normalizedContentText.startsWith('data:image/')) {
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{t('Image artifact preview')}</Typography.Text>
        <img
          alt={artifact.artifactKey || artifact.id}
          src={normalizedContentText}
          style={{
            border: '1px solid #edf0f2',
            borderRadius: 6,
            maxHeight: 420,
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      </Space>
    );
  }

  const defaultActiveKey = preview.items
    .filter((item) => item.defaultOpen)
    .slice(0, 3)
    .map((item) => item.key);
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text type="secondary">{preview.summary}</Typography.Text>
      {preview.items.length ? (
        <Collapse
          size="small"
          defaultActiveKey={defaultActiveKey}
          items={preview.items.map((item) => ({
            key: item.key,
            label: getArtifactItemLabel(t, item.kind, item.label),
            children: <ArtifactPreviewText text={item.text} />,
          }))}
        />
      ) : (
        <ArtifactPreviewText text={preview.text} />
      )}
      <Collapse
        size="small"
        items={[
          {
            key: 'raw',
            label: preview.rawTruncated ? t('Raw artifact text (truncated)') : t('Raw artifact text'),
            children: <ArtifactPreviewText text={preview.rawPreview} />,
          },
        ]}
      />
    </Space>
  );
}

export function ArtifactLazyPreview({
  artifact,
  entry,
  t,
  onLoad,
}: {
  artifact: RunArtifactRecord;
  entry?: ArtifactContentEntry;
  t: TFunction;
  onLoad(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  const inlineContentAvailable = artifact.contentText !== undefined;
  const loaded = entry?.loaded || inlineContentAvailable;
  const contentText = entry?.loaded ? entry.contentText : artifact.contentText;
  const handleChange = async (activeKeys: string | string[]) => {
    const keys = Array.isArray(activeKeys) ? activeKeys : [activeKeys];
    if (keys.includes('preview') && !loaded && !entry?.loading) {
      await onLoad(artifact);
    }
  };
  return (
    <Collapse
      size="small"
      onChange={handleChange}
      items={[
        {
          key: 'preview',
          label: t('Preview'),
          children: entry?.loading ? (
            <Spin size="small" />
          ) : entry?.warning ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Alert type="warning" showIcon message={entry.warning} />
              <Button size="small" onClick={async () => await onLoad(artifact, true)}>
                {t('Retry')}
              </Button>
            </Space>
          ) : loaded ? (
            <ArtifactContentPreview artifact={artifact} contentText={contentText} t={t} />
          ) : (
            <Spin size="small" />
          ),
        },
      ]}
    />
  );
}

export function getArtifactDisplayPriority(artifact: RunArtifactRecord) {
  const mimeType = artifact.mimeType || '';
  const artifactType = artifact.artifactType || '';
  const searchableText = [
    artifact.artifactKey,
    artifact.artifactType,
    artifact.mimeType,
    artifact.metadataJson?.relativePath,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  if (mimeType === 'text/html' || artifactType === 'html-report' || searchableText.includes('report.html')) {
    return 0;
  }
  if (mimeType.startsWith('image/') || artifactType === 'image' || searchableText.includes('browser-screenshots')) {
    return 1;
  }
  if (searchableText.includes('browser-verification')) {
    return 2;
  }
  if (mimeType.includes('json') || artifactType === 'json-report') {
    return 3;
  }
  return 4;
}

export function compareArtifactsForDisplay(first: RunArtifactRecord, second: RunArtifactRecord) {
  const priorityDelta = getArtifactDisplayPriority(first) - getArtifactDisplayPriority(second);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  const firstLabel = first.artifactKey || first.id;
  const secondLabel = second.artifactKey || second.id;
  return firstLabel.localeCompare(secondLabel);
}

export interface ArtifactDisplayGroup {
  key: string;
  label: string;
  artifacts: RunArtifactRecord[];
}

export function getArtifactDisplayGroup(artifact: RunArtifactRecord, t: TFunction) {
  const metadata = getObjectRecord(artifact.metadataJson);
  const groupLabel = getStringValue(metadata.artifactGroupLabel) || getStringValue(metadata.groupLabel);
  const groupKey = getStringValue(metadata.artifactGroupKey) || getStringValue(metadata.groupKey) || groupLabel;
  return {
    key: groupKey ? `group:${groupKey}` : 'group:default',
    label: groupLabel || groupKey || t('Default artifacts'),
  };
}

export function groupArtifactsForDisplay(artifacts: RunArtifactRecord[], t: TFunction) {
  const groups: ArtifactDisplayGroup[] = [];
  const groupIndex = new Map<string, ArtifactDisplayGroup>();
  for (const artifact of artifacts) {
    const groupInfo = getArtifactDisplayGroup(artifact, t);
    let group = groupIndex.get(groupInfo.key);
    if (!group) {
      group = {
        ...groupInfo,
        artifacts: [],
      };
      groupIndex.set(group.key, group);
      groups.push(group);
    }
    group.artifacts.push(artifact);
  }
  return groups;
}

export function getArtifactOverviewCounts(artifacts: RunArtifactRecord[]) {
  return {
    htmlReports: artifacts.filter((artifact) => getArtifactDisplayPriority(artifact) === 0).length,
    screenshots: artifacts.filter((artifact) => getArtifactDisplayPriority(artifact) === 1).length,
    manifests: artifacts.filter((artifact) => artifact.artifactType === 'artifact-manifest').length,
    truncated: artifacts.filter(
      (artifact) => artifact.truncated === true || getObjectRecord(artifact.metadataJson).truncated === true,
    ).length,
    total: artifacts.length,
  };
}

export function ArtifactList({
  t,
  artifacts,
  loading,
  contentEntries,
  onLoadContent,
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  loading?: boolean;
  contentEntries: Record<string, ArtifactContentEntry>;
  onLoadContent(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  return (
    <List
      dataSource={artifacts}
      loading={loading}
      renderItem={(artifact) => (
        <List.Item>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong>
              {[artifact.artifactKey, artifact.artifactType, artifact.mimeType].filter(Boolean).join(' / ') ||
                artifact.id}
            </Typography.Text>
            <Space wrap size={6}>
              {artifact.storageMode ? <Tag>{artifact.storageMode}</Tag> : null}
              {artifact.truncated ? <Tag color="orange">{t('Truncated')}</Tag> : null}
              {artifact.originalSizeBytes ? (
                <Tag>
                  {t('Original size')}: {String(artifact.originalSizeBytes)}
                </Tag>
              ) : null}
              {artifact.previewBytes ? (
                <Tag>
                  {t('Preview size')}: {String(artifact.previewBytes)}
                </Tag>
              ) : null}
            </Space>
            <ArtifactLazyPreview artifact={artifact} entry={contentEntries[artifact.id]} t={t} onLoad={onLoadContent} />
            <JsonPreview value={redactExternalUrlPreviewJson(artifact.metadataJson)} />
          </Space>
        </List.Item>
      )}
    />
  );
}

export function ArtifactsPanel({
  t,
  artifacts,
  snapshots,
  artifactMeta,
  snapshotMeta,
  artifactContentEntries,
  artifactsWarning,
  snapshotsWarning,
  artifactsLoading,
  snapshotsLoading,
  onArtifactPageChange,
  onSnapshotPageChange,
  onLoadArtifactContent,
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  artifactMeta: DetailPageMeta;
  snapshotMeta: DetailPageMeta;
  artifactContentEntries: Record<string, ArtifactContentEntry>;
  artifactsWarning?: string;
  snapshotsWarning?: string;
  artifactsLoading?: boolean;
  snapshotsLoading?: boolean;
  onArtifactPageChange(page: number, pageSize: number): void;
  onSnapshotPageChange(page: number, pageSize: number): void;
  onLoadArtifactContent(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  const displayArtifacts = useMemo(() => [...artifacts].sort(compareArtifactsForDisplay), [artifacts]);
  const artifactGroups = useMemo(() => groupArtifactsForDisplay(displayArtifacts, t), [displayArtifacts, t]);
  const overviewCounts = useMemo(() => getArtifactOverviewCounts(displayArtifacts), [displayArtifacts]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {artifactsWarning ? <Alert type="warning" showIcon message={artifactsWarning} /> : null}
      {displayArtifacts.length ? (
        <Space size={[8, 8]} wrap>
          <Tag>
            {t('Artifacts')}: {artifactMeta.count}
          </Tag>
          <Tag color={overviewCounts.htmlReports ? 'blue' : undefined}>
            {t('HTML reports')}: {overviewCounts.htmlReports}
          </Tag>
          <Tag color={overviewCounts.screenshots ? 'green' : undefined}>
            {t('Screenshots')}: {overviewCounts.screenshots}
          </Tag>
          <Tag color={overviewCounts.manifests ? 'purple' : undefined}>
            {t('Artifact manifests')}: {overviewCounts.manifests}
          </Tag>
          <Tag color={overviewCounts.truncated ? 'orange' : undefined}>
            {t('Truncated')}: {overviewCounts.truncated}
          </Tag>
        </Space>
      ) : null}
      {displayArtifacts.length || artifactsLoading ? (
        artifactGroups.length > 1 ? (
          <Tabs
            destroyInactiveTabPane
            items={artifactGroups.map((group) => ({
              key: group.key,
              label: `${group.label} (${group.artifacts.length})`,
              children: (
                <ArtifactList
                  t={t}
                  artifacts={group.artifacts}
                  loading={artifactsLoading}
                  contentEntries={artifactContentEntries}
                  onLoadContent={onLoadArtifactContent}
                />
              ),
            }))}
          />
        ) : (
          <ArtifactList
            t={t}
            artifacts={displayArtifacts}
            loading={artifactsLoading}
            contentEntries={artifactContentEntries}
            onLoadContent={onLoadArtifactContent}
          />
        )
      ) : (
        <EmptyInline description={t('No artifacts yet')} />
      )}
      {artifactMeta.count > artifactMeta.pageSize ? (
        <Pagination
          current={artifactMeta.page}
          pageSize={artifactMeta.pageSize}
          total={artifactMeta.count}
          showSizeChanger
          pageSizeOptions={DETAIL_PAGE_SIZE_OPTIONS}
          showTotal={(total) => `${t('Total')}: ${total}`}
          onChange={onArtifactPageChange}
        />
      ) : null}

      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('Snapshots')}
      </Typography.Title>
      {snapshotsWarning ? <Alert type="warning" showIcon message={snapshotsWarning} /> : null}
      {snapshots.length || snapshotsLoading ? (
        <List
          dataSource={snapshots}
          loading={snapshotsLoading}
          renderItem={(snapshot) => (
            <List.Item>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>
                  {snapshot.snapshotType || snapshot.id} - {formatDateTime(snapshot.capturedAt)}
                </Typography.Text>
                <JsonPreview value={snapshot.snapshotJson} />
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <EmptyInline description={t('No snapshots yet')} />
      )}
      {snapshotMeta.count > snapshotMeta.pageSize ? (
        <Pagination
          current={snapshotMeta.page}
          pageSize={snapshotMeta.pageSize}
          total={snapshotMeta.count}
          showSizeChanger
          pageSizeOptions={DETAIL_PAGE_SIZE_OPTIONS}
          showTotal={(total) => `${t('Total')}: ${total}`}
          onChange={onSnapshotPageChange}
        />
      ) : null}
    </Space>
  );
}
