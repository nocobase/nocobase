/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined, CloseCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { jsonrepair } from 'jsonrepair';
import React, { useMemo, useState } from 'react';

import { useT } from '../../locale';
import { WORKSPACE_AUTHORING_TOOL_NAMES } from './workspace-authoring';

type WorkspaceDiff = {
  path: string;
  status: 'created' | 'modified' | 'deleted';
  before?: string;
  after?: string;
};

type WorkspaceToolContent = {
  changedPaths?: string[];
  code?: string;
  diffs?: WorkspaceDiff[];
  diagnostics?: unknown[];
  error?: { code?: string; message?: string };
  message?: string;
  saved?: boolean;
  snapshot?: { diagnostics?: unknown[] };
  stale?: boolean;
  status?: 'success' | 'error';
  content?: unknown;
};

type ExecuteFrontendToolArgs = {
  toolId?: string;
  args?: Record<string, unknown>;
};

const statusTag: Record<WorkspaceDiff['status'], string> = {
  created: 'A',
  modified: 'M',
  deleted: 'D',
};

const workspaceErrorTranslationKeys: Record<string, string> = {
  INVALID_CHANGE: 'Workspace change request is invalid.',
  INVALID_PATH: 'Workspace file path is invalid.',
  STALE_SNAPSHOT: 'Workspace snapshot is stale',
  DUPLICATE_TARGET: 'Workspace change targets the same file more than once.',
  FILE_EXISTS: 'Workspace file already exists.',
  FILE_NOT_FOUND: 'Workspace file was not found.',
  BASE_HASH_MISMATCH: 'Workspace file changed since it was read.',
  PATH_ACCESS_DENIED: 'Workspace file access is denied.',
  READ_ONLY_FILE: 'Workspace file is read-only.',
  VIRTUAL_FILE: 'Virtual workspace files cannot be changed.',
  UNSUPPORTED_LANGUAGE: 'Workspace file language is not supported.',
  BINARY_CONTENT: 'Binary workspace file content is not supported.',
  PATCH_CONFLICT: 'Workspace patch no longer applies.',
  PLAN_NOT_FOUND: 'Workspace change plan was not found.',
  PLAN_EXPIRED: 'Workspace change plan has expired.',
  PLAN_CONSUMED: 'Workspace change plan has already been applied.',
  PLAN_APPLYING: 'Workspace change plan is already being applied.',
  CAPABILITY_UNAVAILABLE: 'Workspace authoring is unavailable.',
  SURFACE_DISPOSED: 'Workspace is no longer available.',
  WORKSPACE_SURFACE_UNAVAILABLE: 'Workspace is unavailable.',
  WORKSPACE_SURFACE_MISMATCH: 'Workspace identity has changed.',
  WORKSPACE_CAPABILITY_UNAVAILABLE: 'Workspace authoring is unavailable.',
  WORKSPACE_TOOL_ERROR: 'Workspace tool execution failed.',
  WORKSPACE_CONTEXT_MISMATCH: 'Workspace context has changed.',
  WORKSPACE_CONTEXT_ERROR: 'Workspace context is unavailable.',
};

export function isWorkspaceAuthoringToolId(toolId: unknown): boolean {
  if (typeof toolId !== 'string') {
    return false;
  }
  return (
    toolId.endsWith(`:${WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges}`) ||
    toolId.endsWith(`:${WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges}`)
  );
}

export const WorkspaceChangeCard: React.FC<ToolsUIProperties> = ({ toolCall, decisions }) => {
  const args = parseExecuteArgs(toolCall.args);
  if (!args || !isWorkspaceAuthoringToolId(args.toolId)) {
    return <FrontendToolFallbackCard toolCall={toolCall} decisions={decisions} args={args} />;
  }

  return <WorkspaceAuthoringChangeCard toolCall={toolCall} decisions={decisions} args={args} />;
};

function WorkspaceAuthoringChangeCard({
  toolCall,
  decisions,
  args,
}: Pick<ToolsUIProperties, 'toolCall' | 'decisions'> & { args: ExecuteFrontendToolArgs }) {
  const t = useT();
  const result = parseToolContent(toolCall.content);
  const action = args?.toolId?.endsWith(`:${WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges}`) ? 'prepare' : 'apply';
  const diffs = getDiffs(args, result);
  const changedPaths = getChangedPaths(diffs, result);
  const errorMessage = getErrorMessage(toolCall.status, result, t);
  const diagnostics = result?.diagnostics || result?.snapshot?.diagnostics || [];
  const saved = result?.saved === true;
  const approvalPending = action === 'apply' && toolCall.invokeStatus === 'interrupted' && toolCall.auto !== true;

  return (
    <Card
      data-testid="workspace-change-card"
      data-workspace-action={action}
      size="small"
      title={action === 'prepare' ? t('Workspace change plan') : t('Apply workspace change plan')}
      extra={
        errorMessage ? (
          <CloseCircleOutlined aria-label={t('Workspace change failed')} />
        ) : toolCall.invokeStatus === 'done' || toolCall.invokeStatus === 'confirmed' ? (
          <CheckCircleOutlined aria-label={t('Workspace change completed')} />
        ) : null
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Typography.Text data-testid="workspace-change-card-status">
          {approvalPending
            ? t('Waiting for approval')
            : errorMessage
              ? t('Workspace change failed')
              : toolCall.invokeStatus === 'done' || toolCall.invokeStatus === 'confirmed'
                ? t('Workspace change completed')
                : t('Workspace change pending')}
        </Typography.Text>

        {changedPaths.length ? (
          <div aria-label={t('Changed workspace files')} data-testid="workspace-change-card-paths">
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {changedPaths.map((path) => {
                const diff = diffs.find((item) => item.path === path);
                return diff ? <WorkspaceDiffRow diff={diff} key={path} /> : <WorkspacePath path={path} key={path} />;
              })}
            </Space>
          </div>
        ) : null}

        {result?.stale ? <Tag color="warning">{t('Workspace snapshot is stale')}</Tag> : null}
        {diagnostics.length ? (
          <Typography.Text data-testid="workspace-change-card-validation">
            {t('{{count}} validation diagnostic(s)').replace('{{count}}', String(diagnostics.length))}
          </Typography.Text>
        ) : null}
        <Typography.Text data-testid="workspace-change-card-saved" type={saved ? 'success' : 'secondary'}>
          {saved ? t('Saved') : t('Not saved')}
        </Typography.Text>
        {errorMessage ? (
          <Typography.Text data-testid="workspace-change-card-error" role="alert" type="danger">
            {errorMessage}
          </Typography.Text>
        ) : null}
        {approvalPending ? (
          <Button aria-label={t('Allow use')} onClick={() => decisions.approve()} size="small" type="primary">
            {t('Allow use')}
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}

function WorkspaceDiffRow({ diff }: { diff: WorkspaceDiff }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const details = useMemo(() => formatDiff(diff), [diff]);
  return (
    <div data-testid="workspace-change-path">
      <Button
        aria-expanded={expanded}
        aria-label={`${expanded ? t('Collapse changes for') : t('Expand changes for')} ${diff.path}`}
        block
        icon={expanded ? <DownOutlined /> : <RightOutlined />}
        onClick={() => setExpanded((current) => !current)}
        size="small"
        style={{ justifyContent: 'flex-start' }}
        type="text"
      >
        <Tag>{statusTag[diff.status]}</Tag>
        <span>{diff.path}</span>
      </Button>
      {expanded ? (
        <pre
          aria-label={`${t('Changes for')} ${diff.path}`}
          style={{ margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap' }}
        >
          {details}
        </pre>
      ) : null}
    </div>
  );
}

function WorkspacePath({ path }: { path: string }) {
  return (
    <Typography.Text data-testid="workspace-change-path" code>
      {path}
    </Typography.Text>
  );
}

function FrontendToolFallbackCard({
  toolCall,
  decisions,
  args,
}: Pick<ToolsUIProperties, 'toolCall' | 'decisions'> & { args: ExecuteFrontendToolArgs | null }) {
  const t = useT();
  const approvalPending = toolCall.invokeStatus === 'interrupted' && toolCall.auto !== true;
  return (
    <Card data-testid="frontend-tool-execution-card" size="small" title={t('Execute frontend tool')}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Typography.Text>{args?.toolId || toolCall.name}</Typography.Text>
        {approvalPending ? (
          <Button aria-label={t('Allow use')} onClick={() => decisions.approve()} size="small" type="primary">
            {t('Allow use')}
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}

function parseExecuteArgs(value: unknown): ExecuteFrontendToolArgs | null {
  const parsed = parseJsonValue(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const input = parsed as Record<string, unknown>;
  return {
    toolId: typeof input.toolId === 'string' ? input.toolId : undefined,
    args: input.args && typeof input.args === 'object' && !Array.isArray(input.args) ? input.args : undefined,
  };
}

function parseToolContent(value: unknown): WorkspaceToolContent | null {
  const parsed = parseJsonValue(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const result = parsed as WorkspaceToolContent;
  if ((result.status === 'success' || result.status === 'error') && 'content' in result) {
    const nested = parseJsonValue(result.content);
    return nested && typeof nested === 'object' && !Array.isArray(nested)
      ? ({ ...(nested as WorkspaceToolContent), status: result.status } as WorkspaceToolContent)
      : result;
  }
  return result;
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    return JSON.parse(jsonrepair(trimmed)) as unknown;
  } catch {
    return value;
  }
}

function getDiffs(args: ExecuteFrontendToolArgs | null, result: WorkspaceToolContent | null): WorkspaceDiff[] {
  if (Array.isArray(result?.diffs)) {
    return result.diffs.filter(isWorkspaceDiff);
  }
  const changes = args?.args?.changes;
  if (!Array.isArray(changes)) {
    return [];
  }
  return changes.flatMap((change) => {
    if (!change || typeof change !== 'object' || Array.isArray(change)) {
      return [];
    }
    const item = change as Record<string, unknown>;
    if (typeof item.path !== 'string') {
      return [];
    }
    const status = item.type === 'create' ? 'created' : item.type === 'delete' ? 'deleted' : 'modified';
    return [{ path: item.path, status } as WorkspaceDiff];
  });
}

function isWorkspaceDiff(value: unknown): value is WorkspaceDiff {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const diff = value as Partial<WorkspaceDiff>;
  return (
    typeof diff.path === 'string' &&
    (diff.status === 'created' || diff.status === 'modified' || diff.status === 'deleted')
  );
}

function getChangedPaths(diffs: WorkspaceDiff[], result: WorkspaceToolContent | null): string[] {
  const paths = Array.isArray(result?.changedPaths)
    ? result.changedPaths.filter((path): path is string => typeof path === 'string')
    : diffs.map((diff) => diff.path);
  return Array.from(new Set(paths));
}

function getErrorMessage(
  status: ToolsUIProperties['toolCall']['status'],
  result: WorkspaceToolContent | null,
  translate: (key: string) => string,
) {
  if (status !== 'error' && result?.status !== 'error') {
    return undefined;
  }
  const code = result?.code || result?.error?.code;
  return translate((code && workspaceErrorTranslationKeys[code]) || 'Workspace tool execution failed.');
}

function formatDiff(diff: WorkspaceDiff): string {
  const before = typeof diff.before === 'string' ? diff.before : '';
  const after = typeof diff.after === 'string' ? diff.after : '';
  if (diff.status === 'created') {
    return after;
  }
  if (diff.status === 'deleted') {
    return before;
  }
  return `--- before\n${before}\n+++ after\n${after}`;
}
