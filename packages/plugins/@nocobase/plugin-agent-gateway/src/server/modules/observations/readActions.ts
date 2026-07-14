/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import { Context } from '@nocobase/actions';

import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../../shared/conversationLimits';
import {
  AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
  AgentCapabilityKey,
  getUnsupportedCapabilityMessage,
} from '../../../shared/providerCapabilities';
import { AGENT_GATEWAY_ACTIONS } from '../../security';
import { ModelRecord, assertRunVisible, getModelValue, requireAgentGatewayPermission } from '../../actions/utils';
import { getRunProviderCapabilitySummary, isRunCapabilitySupported } from '../../actions/capabilityUtils';
import { findCursorPage, getBoundedPositiveIntegerQuery } from '../../actions/cursorPagination';
import { readSharedStorageBuffer } from '../../services/sharedFileStorage';
import {
  applyDeclaredArtifactGroups,
  getArtifactStorageObject,
  serializeArtifact,
  serializeModel,
} from './artifactProjection';
import { serializeRunEvent } from './runEvent';

const MAX_ARTIFACT_TEXT_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS;
const DEFAULT_EVENT_PAGE_SIZE = 100;
const MAX_EVENT_PAGE_SIZE = 500;
const DEFAULT_DETAIL_PAGE_SIZE = 20;
const MAX_DETAIL_PAGE_SIZE = 100;

function getDetailPagination(ctx: Context) {
  const page = getBoundedPositiveIntegerQuery(ctx, 'page', 1, Number.MAX_SAFE_INTEGER);
  const pageSize = getBoundedPositiveIntegerQuery(
    ctx,
    'pageSize',
    DEFAULT_DETAIL_PAGE_SIZE,
    MAX_DETAIL_PAGE_SIZE,
    'limit',
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function requireObservabilityRead(ctx: Context, action: string, message: string) {
  await requireAgentGatewayPermission(ctx, action, message);
}

async function assertObservationCapability(ctx: Context, run: ModelRecord, capability: AgentCapabilityKey) {
  const capabilitySummary = await getRunProviderCapabilitySummary(ctx, run);
  if (isRunCapabilitySupported(capabilitySummary, capability)) {
    return;
  }
  ctx.throw(409, {
    code: AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
    message: getUnsupportedCapabilityMessage(capability),
  });
}

export async function listRunEvents(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRawLogs,
    'Agent Gateway raw log read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'structuredEvents');
  const page = await findCursorPage({
    ctx,
    filter: { runId },
    scope: `observability:events:${runId}`,
    cursorField: 'ingestId',
    defaultPageSize: DEFAULT_EVENT_PAGE_SIZE,
    maxPageSize: MAX_EVENT_PAGE_SIZE,
    findRows: (options) => ctx.db.getRepository('agRunEvents').find(options) as Promise<ModelRecord[]>,
  });
  ctx.body = {
    rows: page.rows.map(serializeRunEvent),
    pageSize: page.pageSize,
    beforeCursor: page.beforeCursor,
    afterCursor: page.afterCursor,
    hasMoreBefore: page.hasMoreBefore,
    hasMoreAfter: page.hasMoreAfter,
  };
}

export async function listRunArtifacts(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');
  const { page, pageSize, offset } = getDetailPagination(ctx);
  const repository = ctx.db.getRepository('agRunArtifacts');
  const [artifacts, count] = await Promise.all([
    repository.find({
      filter: { runId },
      sort: ['-createdAt', '-id'],
      offset,
      limit: pageSize,
      except: ['contentText'],
    }) as Promise<ModelRecord[]>,
    repository.count({ filter: { runId } }),
  ]);
  ctx.body = {
    rows: applyDeclaredArtifactGroups(artifacts.map(serializeArtifact), run),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

export async function getRunArtifactContent(ctx: Context, runId: string, artifactId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');
  const artifact = (await ctx.db.getRepository('agRunArtifacts').findOne({
    filter: { id: artifactId, runId },
  })) as ModelRecord | null;
  if (!artifact) {
    ctx.throw(404, 'Artifact not found');
  }
  const storageId = getModelValue(artifact, 'storageId');
  if (storageId === null || storageId === undefined) {
    ctx.body = { id: artifactId, contentText: artifact.get('contentText') ?? null };
    return;
  }
  let storageObject;
  try {
    storageObject = getArtifactStorageObject(artifact);
  } catch {
    ctx.throw(409, 'Artifact storage locator is invalid');
  }
  let content: Buffer;
  try {
    content = await readSharedStorageBuffer({ app: ctx.app }, storageObject, MAX_ARTIFACT_TEXT_BYTES);
  } catch {
    ctx.throw(409, 'Artifact storage content is unavailable');
  }
  const storageSha256 = getModelValue(artifact, 'storageSha256');
  if (
    content.byteLength !== storageObject.sizeBytes ||
    typeof storageSha256 !== 'string' ||
    !storageSha256 ||
    createHash('sha256').update(content).digest('hex') !== storageSha256
  ) {
    ctx.throw(409, 'Artifact storage integrity check failed');
  }
  ctx.body = { id: artifactId, contentText: content.toString('utf8') };
}

async function listPagedModels(ctx: Context, runId: string, collectionName: string, sort: string[]) {
  const { page, pageSize, offset } = getDetailPagination(ctx);
  const repository = ctx.db.getRepository(collectionName);
  const [rows, count] = await Promise.all([
    repository.find({ filter: { runId }, sort, offset, limit: pageSize }) as Promise<ModelRecord[]>,
    repository.count({ filter: { runId } }),
  ]);
  ctx.body = {
    rows: rows.map(serializeModel),
    count,
    page,
    pageSize,
    totalPage: Math.ceil(count / pageSize),
  };
}

export async function listRunSnapshots(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readArtifacts,
    'Agent Gateway artifact read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'artifacts');
  await listPagedModels(ctx, runId, 'agRunSnapshots', ['-capturedAt', '-createdAt', '-id']);
}

export async function listRunApiCallLogs(ctx: Context, runId: string) {
  await requireObservabilityRead(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRawLogs,
    'Agent Gateway raw log read permission required',
  );
  const run = await assertRunVisible(ctx, runId, 'get');
  await assertObservationCapability(ctx, run, 'structuredEvents');
  await listPagedModels(ctx, runId, 'agApiCallLogs', ['-createdAt', '-id']);
}
