/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  MinusCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { CodeAuthoringFileDiff, ToolsUIProperties } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { jsonrepair } from 'jsonrepair';
import React, { useMemo, useState } from 'react';

import { useT } from '../../locale';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatBoxRuntime } from '../chatbox/stores/runtime';
import { isCurrentLiveMessage } from '../chatbox/utils';
import type { Message, ToolCall } from '../types';
import { WORKSPACE_AUTHORING_TOOL_NAMES } from './workspace-authoring';

type WorkspaceToolContent = {
  changedPaths?: unknown;
  diffs?: unknown;
  diagnostics?: unknown;
  error?: unknown;
  planId?: unknown;
  saved?: unknown;
  snapshot?: unknown;
  stale?: unknown;
  status?: unknown;
  surfaceId?: unknown;
  content?: unknown;
  message?: unknown;
};

type ExecuteFrontendToolArgs = {
  toolId?: string;
  args?: Record<string, unknown>;
};

type WorkspaceToolIdentity = {
  action: 'prepare' | 'apply';
  surfaceId: string;
};

const statusTag: Record<CodeAuthoringFileDiff['status'], string> = {
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

const WorkspaceChangeCardBase: React.FC<ToolsUIProperties> = (props) => {
  const runtime = useChatBoxRuntime();
  const readonly = runtime.chatBoxModel.readonly;
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
  const messages = chat.use.messages();
  const responseLoading = chat.use.responseLoading();
  const latestMessageId = messages[messages.length - 1]?.content?.messageId;
  const generating =
    responseLoading && isCurrentLiveMessage(latestMessageId, props.messageId, props.toolCall.messageId);
  const args = parseExecuteArgs(props.toolCall.args);
  const identity = getWorkspaceToolIdentity(args?.toolId);

  if (!args || !identity) {
    return (
      <FrontendToolFallbackCard
        toolCall={props.toolCall}
        decisions={props.decisions}
        args={args}
        readonly={readonly}
        generating={generating}
      />
    );
  }

  return (
    <WorkspaceAuthoringChangeCard
      toolCall={props.toolCall}
      decisions={props.decisions}
      args={args}
      identity={identity}
      messages={messages}
      readonly={readonly}
    />
  );
};

export const WorkspaceChangeCard = observer(WorkspaceChangeCardBase);

function WorkspaceAuthoringChangeCard({
  toolCall,
  decisions,
  args,
  identity,
  messages,
  readonly,
}: Pick<ToolsUIProperties, 'toolCall' | 'decisions'> & {
  args: ExecuteFrontendToolArgs;
  identity: WorkspaceToolIdentity;
  messages: Message[];
  readonly: boolean;
}) {
  const t = useT();
  const currentResult = parseToolContent(toolCall.content);
  const preparedResult =
    identity.action === 'apply' ? findPreparedResult(messages, toolCall, args, identity.surfaceId) : null;
  const displayResult = preparedResult ? mergePreparedResult(currentResult, preparedResult) : currentResult;
  const diffs = getDiffs(args, displayResult);
  const changedPaths = identity.action === 'apply' && !preparedResult ? [] : getChangedPaths(diffs, displayResult);
  const errorMessage = getErrorMessage(toolCall.status, currentResult, t);
  const diagnostics = getDiagnostics(currentResult);
  const saved = displayResult?.saved === true;
  const approvalPending =
    identity.action === 'apply' && toolCall.invokeStatus === 'interrupted' && toolCall.auto !== true;
  const [approvalLoading, setApprovalLoading] = useState(false);

  const approve = async () => {
    if (readonly || approvalLoading) {
      return;
    }
    setApprovalLoading(true);
    try {
      await decisions.approve();
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <Card
      data-testid="workspace-change-card"
      data-workspace-action={identity.action}
      size="small"
      title={identity.action === 'prepare' ? t('Workspace change plan') : t('Apply workspace change plan')}
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

        {currentResult?.stale === true ? <Tag color="warning">{t('Workspace snapshot is stale')}</Tag> : null}
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
          <Button
            aria-label={t('Allow use')}
            disabled={readonly}
            loading={approvalLoading}
            onClick={approve}
            size="small"
            type="primary"
          >
            {t('Allow use')}
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}

function WorkspaceDiffRow({ diff }: { diff: CodeAuthoringFileDiff }) {
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
  readonly,
  generating,
}: Pick<ToolsUIProperties, 'toolCall' | 'decisions'> & {
  args: ExecuteFrontendToolArgs | null;
  readonly: boolean;
  generating: boolean;
}) {
  const t = useT();
  const approvalPending = toolCall.invokeStatus === 'interrupted' && toolCall.auto !== true;
  const [expanded, setExpanded] = useState(approvalPending);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const serializedArgs = useMemo(() => stringifyToolArgs(toolCall.args), [toolCall.args]);
  const hasArgs = serializedArgs !== '{}';
  const errorMessage = getFallbackErrorMessage(toolCall);
  const pending = generating || toolCall.invokeStatus === 'pending';

  const approve = async () => {
    if (readonly || approvalLoading) {
      return;
    }
    setApprovalLoading(true);
    try {
      await decisions.approve();
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <Card data-testid="frontend-tool-execution-card" size="small" title={t('Execute frontend tool')}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Button
          aria-expanded={expanded}
          block
          disabled={!hasArgs}
          icon={<FallbackStatusIcon toolCall={toolCall} pending={pending} />}
          onClick={() => setExpanded((current) => !current)}
          style={{ justifyContent: 'flex-start' }}
          type="text"
        >
          {args?.toolId || toolCall.name}
          {hasArgs ? expanded ? <DownOutlined /> : <RightOutlined /> : null}
        </Button>
        {expanded && hasArgs ? (
          <pre
            data-testid="frontend-tool-execution-args"
            style={{ margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap' }}
          >
            {serializedArgs}
          </pre>
        ) : null}
        {errorMessage ? (
          <Typography.Text data-testid="frontend-tool-execution-error" role="alert" type="danger">
            {errorMessage}
          </Typography.Text>
        ) : null}
        {approvalPending ? (
          <Button
            aria-label={t('Allow use')}
            disabled={readonly}
            loading={approvalLoading}
            onClick={approve}
            size="small"
            type="primary"
          >
            {t('Allow use')}
          </Button>
        ) : null}
      </Space>
    </Card>
  );
}

function FallbackStatusIcon({ toolCall, pending }: Pick<ToolsUIProperties, 'toolCall'> & { pending: boolean }) {
  if (pending) {
    return <ClockCircleOutlined aria-label="pending" />;
  }
  if (toolCall.invokeStatus === 'done' || toolCall.invokeStatus === 'confirmed') {
    return toolCall.status === 'error' ? (
      <CloseCircleOutlined aria-label="error" />
    ) : (
      <CheckCircleOutlined aria-label="success" />
    );
  }
  return <MinusCircleOutlined aria-label="waiting" />;
}

function stringifyToolArgs(args: unknown): string {
  try {
    return JSON.stringify(args, null, 2) ?? '{}';
  } catch {
    return typeof args === 'string' ? args : '{}';
  }
}

function getFallbackErrorMessage(toolCall: ToolsUIProperties['toolCall']): string | undefined {
  if (toolCall.status !== 'error') {
    return undefined;
  }
  const result = parseToolContent(toolCall.content);
  const error = isRecord(result?.error) ? result.error : null;
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return typeof result?.message === 'string' ? result.message : undefined;
}

function parseExecuteArgs(value: unknown): ExecuteFrontendToolArgs | null {
  const parsed = parseJsonValue(value);
  if (!isRecord(parsed)) {
    return null;
  }
  const nestedArgs = parseJsonValue(parsed.args);
  return {
    toolId: typeof parsed.toolId === 'string' ? parsed.toolId : undefined,
    args: isRecord(nestedArgs) ? nestedArgs : undefined,
  };
}

function parseToolContent(value: unknown): WorkspaceToolContent | null {
  const parsed = parseJsonValue(value);
  if (!isRecord(parsed)) {
    return null;
  }
  const result = parsed as WorkspaceToolContent;
  if ((result.status === 'success' || result.status === 'error') && 'content' in result) {
    const nested = parseJsonValue(result.content);
    return isRecord(nested) ? { ...nested, status: result.status } : result;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getWorkspaceToolIdentity(toolId: unknown): WorkspaceToolIdentity | null {
  if (typeof toolId !== 'string') {
    return null;
  }
  const prepareSuffix = `:${WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges}`;
  const applySuffix = `:${WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges}`;
  if (toolId.endsWith(prepareSuffix)) {
    const surfaceId = toolId.slice(0, -prepareSuffix.length);
    return surfaceId ? { action: 'prepare', surfaceId } : null;
  }
  if (toolId.endsWith(applySuffix)) {
    const surfaceId = toolId.slice(0, -applySuffix.length);
    return surfaceId ? { action: 'apply', surfaceId } : null;
  }
  return null;
}

function findPreparedResult(
  messages: Message[],
  currentToolCall: ToolsUIProperties['toolCall'],
  applyArgs: ExecuteFrontendToolArgs,
  surfaceId: string,
): WorkspaceToolContent | null {
  const planId = applyArgs.args?.planId;
  if (typeof planId !== 'string' || !planId) {
    return null;
  }
  const toolCalls = flattenToolCalls(messages);
  let currentIndex = toolCalls.findIndex((candidate) => candidate.id === currentToolCall.id);
  if (currentIndex < 0) {
    currentIndex = toolCalls.length;
  }
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const candidate = toolCalls[index];
    const candidateArgs = parseExecuteArgs(candidate.args);
    if (
      candidate.name !== currentToolCall.name ||
      candidateArgs?.toolId !== `${surfaceId}:${WORKSPACE_AUTHORING_TOOL_NAMES.prepareChanges}` ||
      candidate.status === 'error' ||
      (candidate.invokeStatus !== 'done' && candidate.invokeStatus !== 'confirmed')
    ) {
      continue;
    }
    const result = parseToolContent(candidate.content);
    if (
      result?.status === 'error' ||
      result?.planId !== planId ||
      (typeof result?.surfaceId === 'string' && result.surfaceId !== surfaceId) ||
      !getResultDiffs(result).length
    ) {
      continue;
    }
    return result;
  }
  return null;
}

function flattenToolCalls(messages: Message[]): ToolCall<unknown>[] {
  const toolCalls: ToolCall<unknown>[] = [];
  for (const message of messages) {
    toolCalls.push(...(message.content?.tool_calls ?? []));
    for (const conversation of message.content?.subAgentConversations ?? []) {
      toolCalls.push(...flattenToolCalls(conversation.messages));
    }
  }
  return toolCalls;
}

function mergePreparedResult(
  currentResult: WorkspaceToolContent | null,
  preparedResult: WorkspaceToolContent,
): WorkspaceToolContent {
  return {
    ...preparedResult,
    ...(currentResult ?? {}),
    changedPaths: currentResult?.changedPaths ?? preparedResult.changedPaths,
    diffs: preparedResult.diffs,
    saved: currentResult?.saved ?? preparedResult.saved,
  };
}

function getDiffs(args: ExecuteFrontendToolArgs | null, result: WorkspaceToolContent | null): CodeAuthoringFileDiff[] {
  const resultDiffs = getResultDiffs(result);
  if (Array.isArray(result?.diffs)) {
    return resultDiffs;
  }
  const changes = args?.args?.changes;
  if (!Array.isArray(changes)) {
    return [];
  }
  return changes.flatMap((change) => {
    if (
      !isRecord(change) ||
      typeof change.path !== 'string' ||
      (change.type !== 'create' && change.type !== 'update' && change.type !== 'delete')
    ) {
      return [];
    }
    const status = change.type === 'create' ? 'created' : change.type === 'delete' ? 'deleted' : 'modified';
    return [{ path: change.path, status } as CodeAuthoringFileDiff];
  });
}

function getResultDiffs(result: WorkspaceToolContent | null): CodeAuthoringFileDiff[] {
  return Array.isArray(result?.diffs) ? result.diffs.filter(isWorkspaceDiff) : [];
}

function isWorkspaceDiff(value: unknown): value is CodeAuthoringFileDiff {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.path === 'string' &&
    (value.status === 'created' || value.status === 'modified' || value.status === 'deleted') &&
    (value.before === undefined || typeof value.before === 'string') &&
    (value.after === undefined || typeof value.after === 'string')
  );
}

function getChangedPaths(diffs: CodeAuthoringFileDiff[], result: WorkspaceToolContent | null): string[] {
  const paths = Array.isArray(result?.changedPaths)
    ? result.changedPaths.filter((path): path is string => typeof path === 'string')
    : diffs.map((diff) => diff.path);
  return Array.from(new Set(paths));
}

function getDiagnostics(result: WorkspaceToolContent | null): unknown[] {
  if (Array.isArray(result?.diagnostics)) {
    return result.diagnostics;
  }
  return isRecord(result?.snapshot) && Array.isArray(result.snapshot.diagnostics) ? result.snapshot.diagnostics : [];
}

function getErrorMessage(
  status: ToolsUIProperties['toolCall']['status'],
  result: WorkspaceToolContent | null,
  translate: (key: string) => string,
) {
  if (status !== 'error' && result?.status !== 'error') {
    return undefined;
  }
  const error = isRecord(result?.error) ? result.error : null;
  const code =
    typeof result?.code === 'string' ? result.code : typeof error?.code === 'string' ? error.code : undefined;
  return translate((code && workspaceErrorTranslationKeys[code]) || 'Workspace tool execution failed.');
}

function formatDiff(diff: CodeAuthoringFileDiff): string {
  const before = diff.before ?? '';
  const after = diff.after ?? '';
  if (diff.status === 'created') {
    return after;
  }
  if (diff.status === 'deleted') {
    return before;
  }
  return `--- before\n${before}\n+++ after\n${after}`;
}
