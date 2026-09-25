/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Context } from '@nocobase/actions';
import type { PluginAIPageServer } from './plugin';
import { AIPageEventHub } from './event-hub';
import { aiPageOpenAPI } from './openapi';
import { applyUnifiedPatch } from './unified-patch';
import { validateAIPageCode } from './validation';

type JsonObject = Record<string, unknown>;
type DatabaseRecord = { toJSON(): JsonObject };
type AIPageHttpState = { params: Record<string, string>; publicBasePath: string };

const INITIAL_CODE = `ctx.render(\`
  <main style="max-width: 960px; margin: 0 auto; padding: 48px 24px;">
    <h1 style="margin: 0 0 16px;">\${ctx.i18n.t('Welcome to AI Page', { ns: '@nocobase/plugin-ai-page' })}</h1>
    <p style="color: #667085;">\${ctx.i18n.t('Open Agent to connect an AI coding agent and start building.', { ns: '@nocobase/plugin-ai-page' })}</p>
  </main>
\`);`;

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

function getBody(ctx: Context): JsonObject {
  const body = ctx.request.body;
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as JsonObject) : {};
}

function getHttpState(ctx: Context) {
  return ctx.state.aiPageHttp as AIPageHttpState;
}

function toJson(record: unknown): JsonObject | undefined {
  if (!record || typeof record !== 'object' || typeof (record as DatabaseRecord).toJSON !== 'function') {
    return undefined;
  }
  return (record as DatabaseRecord).toJSON();
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export class AIPageService {
  readonly eventHub = new AIPageEventHub();

  constructor(private readonly plugin: PluginAIPageServer) {}

  private get pages() {
    return this.plugin.db.getRepository('aiPages');
  }

  private get revisionsRepository() {
    return this.plugin.db.getRepository('aiPageRevisions');
  }

  private get sessions() {
    return this.plugin.db.getRepository('aiPageAgentSessions');
  }

  private respond(ctx: Context, body: unknown, status = 200) {
    ctx.withoutDataWrapping = true;
    ctx.status = status;
    ctx.type = 'application/json';
    ctx.body = body;
  }

  private fail(ctx: Context, status: number, code: string, message: string, details?: JsonObject) {
    this.respond(
      ctx,
      {
        error: {
          code,
          message: ctx.t(message, { ns: '@nocobase/plugin-ai-page' }),
          ...details,
        },
      },
      status,
    );
  }

  private async findPage(pageSchemaUid: string) {
    return await this.pages.findOne({ filter: { pageSchemaUid } });
  }

  private async requirePage(ctx: Context) {
    const { pageSchemaUid } = getHttpState(ctx).params;
    const record = await this.findPage(pageSchemaUid);
    if (!record) {
      this.fail(ctx, 404, 'page_not_found', 'AI Page not found');
      return;
    }
    return { pageSchemaUid, record, data: toJson(record) || {} };
  }

  private async validateAgent(ctx: Context, expectedPageSchemaUid?: string, expectedSessionId?: string) {
    const token = ctx.get('Authorization').replace(/^Bearer\s+/i, '');
    if (!token.startsWith('aip_')) {
      this.fail(ctx, 401, 'invalid_token', 'A page-scoped bearer token is required');
      return;
    }
    const filter: JsonObject = {
      accessTokenHash: hashSecret(token),
      status: 'paired',
    };
    if (expectedPageSchemaUid) {
      filter.pageSchemaUid = expectedPageSchemaUid;
    }
    if (expectedSessionId) {
      filter.sessionId = expectedSessionId;
    }
    const record = await this.sessions.findOne({ filter });
    const data = toJson(record);
    const expiresAt = data?.expiresAt ? new Date(String(data.expiresAt)).getTime() : 0;
    if (!record || expiresAt <= Date.now()) {
      this.fail(ctx, 401, 'expired_token', 'The page-scoped bearer token is invalid or expired');
      return;
    }
    await this.sessions.update({
      filter: { sessionId: data?.sessionId },
      values: { lastSeenAt: new Date() },
    });
    return data;
  }

  private async writeDraft(
    ctx: Context,
    pageSchemaUid: string,
    page: JsonObject,
    code: string,
    baseRevision: number | undefined,
    summary?: string,
  ) {
    const currentRevision = getNumber(page.draftRevision) || 1;
    if (baseRevision !== currentRevision) {
      this.fail(ctx, 409, 'revision_conflict', 'The draft changed after it was read', {
        currentRevision,
      });
      return;
    }
    const validation = validateAIPageCode(code);
    if (!validation.valid) {
      this.fail(ctx, 422, 'validation_failed', 'The source contains syntax errors', { validation });
      return;
    }
    const nextRevision = currentRevision + 1;
    await this.plugin.db.sequelize.transaction(async (transaction) => {
      await this.pages.update({
        filter: { pageSchemaUid },
        values: { draftCode: code, draftRevision: nextRevision },
        transaction,
      });
      await this.revisionsRepository.create({
        values: {
          pageSchemaUid,
          revision: nextRevision,
          code,
          summary,
          published: false,
        },
        transaction,
      });
    });
    this.eventHub.emitForPage(pageSchemaUid, {
      type: 'source.changed',
      pageSchemaUid,
      body: { revision: nextRevision },
    });
    this.respond(ctx, { pageSchemaUid, revision: nextRevision, validation });
  }

  openapi = async (ctx: Context) => {
    this.respond(ctx, aiPageOpenAPI);
  };

  createPage = async (ctx: Context) => {
    const body = getBody(ctx);
    const pageSchemaUid = getString(body.pageSchemaUid);
    if (!pageSchemaUid) {
      this.fail(ctx, 400, 'page_uid_required', 'pageSchemaUid is required');
      return;
    }
    const existing = await this.findPage(pageSchemaUid);
    if (existing) {
      this.respond(ctx, toJson(existing), 200);
      return;
    }
    const title = getString(body.title) || ctx.t('AI Page', { ns: '@nocobase/plugin-ai-page' });
    const record = await this.plugin.db.sequelize.transaction(async (transaction) => {
      const created = await this.pages.create({
        values: {
          pageSchemaUid,
          title,
          draftCode: INITIAL_CODE,
          publishedCode: INITIAL_CODE,
          draftRevision: 1,
          publishedRevision: 1,
          codeVersion: 'v2',
        },
        transaction,
      });
      await this.revisionsRepository.create({
        values: {
          pageSchemaUid,
          revision: 1,
          code: INITIAL_CODE,
          summary: ctx.t('Initial version', { ns: '@nocobase/plugin-ai-page' }),
          published: true,
        },
        transaction,
      });
      return created;
    });
    this.respond(ctx, toJson(record), 201);
  };

  getPage = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (page) {
      this.respond(ctx, page.data);
    }
  };

  agentGetPage = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.getPage(ctx);
  };

  deletePage = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    await this.plugin.db.sequelize.transaction(async (transaction) => {
      await this.sessions.destroy({ filter: { pageSchemaUid }, transaction });
      await this.revisionsRepository.destroy({ filter: { pageSchemaUid }, transaction });
      await this.pages.destroy({ filter: { pageSchemaUid }, transaction });
    });
    this.respond(ctx, { success: true });
  };

  getSource = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    ctx.set('ETag', `"${page.data.draftRevision}"`);
    this.respond(ctx, {
      pageSchemaUid: page.pageSchemaUid,
      code: page.data.draftCode,
      revision: page.data.draftRevision,
      publishedRevision: page.data.publishedRevision,
      version: page.data.codeVersion,
    });
  };

  agentGetSource = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.getSource(ctx);
  };

  putSource = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const body = getBody(ctx);
    const code = getString(body.code);
    if (code === undefined) {
      this.fail(ctx, 400, 'source_required', 'code is required');
      return;
    }
    await this.writeDraft(
      ctx,
      page.pageSchemaUid,
      page.data,
      code,
      getNumber(body.baseRevision),
      getString(body.summary),
    );
  };

  agentPutSource = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.putSource(ctx);
  };

  patchSource = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const body = getBody(ctx);
    const patch = getString(body.patch);
    if (!patch) {
      this.fail(ctx, 400, 'patch_required', 'A unified diff patch is required');
      return;
    }
    let code: string;
    try {
      code = applyUnifiedPatch(getString(page.data.draftCode) || '', patch);
    } catch (error) {
      this.fail(ctx, 422, 'patch_failed', error instanceof Error ? error.message : String(error));
      return;
    }
    await this.writeDraft(
      ctx,
      page.pageSchemaUid,
      page.data,
      code,
      getNumber(body.baseRevision),
      getString(body.summary),
    );
  };

  agentPatchSource = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.patchSource(ctx);
  };

  validateSource = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const code = getString(getBody(ctx).code) ?? getString(page.data.draftCode) ?? '';
    this.respond(ctx, validateAIPageCode(code));
  };

  agentValidateSource = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.validateSource(ctx);
  };

  preview = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    this.eventHub.emitForPage(page.pageSchemaUid, {
      type: 'preview.requested',
      pageSchemaUid: page.pageSchemaUid,
      body: { revision: page.data.draftRevision },
    });
    this.respond(ctx, { success: true, revision: page.data.draftRevision });
  };

  agentPreview = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.preview(ctx);
  };

  publish = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const code = getString(page.data.draftCode) || '';
    const validation = validateAIPageCode(code);
    if (!validation.valid) {
      this.fail(ctx, 422, 'validation_failed', 'The draft cannot be published', { validation });
      return;
    }
    const revision = getNumber(page.data.draftRevision) || 1;
    await this.plugin.db.sequelize.transaction(async (transaction) => {
      await this.pages.update({
        filter: { pageSchemaUid: page.pageSchemaUid },
        values: { publishedCode: code, publishedRevision: revision },
        transaction,
      });
      await this.revisionsRepository.update({
        filter: { pageSchemaUid: page.pageSchemaUid, revision },
        values: { published: true },
        transaction,
      });
    });
    this.eventHub.emitForPage(page.pageSchemaUid, {
      type: 'page.published',
      pageSchemaUid: page.pageSchemaUid,
      body: { revision },
    });
    this.respond(ctx, { success: true, revision, validation });
  };

  revisions = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    const records = await this.revisionsRepository.find({
      filter: { pageSchemaUid },
      sort: ['-revision'],
      limit: 50,
    });
    this.respond(
      ctx,
      records.map((record) => {
        const data = toJson(record) || {};
        return {
          id: data.id,
          revision: data.revision,
          summary: data.summary,
          published: data.published,
          createdAt: data.createdAt,
          createdById: data.createdById,
        };
      }),
    );
  };

  agentRevisions = async (ctx: Context) => {
    const { pageSchemaUid } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, pageSchemaUid))) {
      return;
    }
    await this.revisions(ctx);
  };

  rollback = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const revision = getNumber(getBody(ctx).revision);
    const revisionRecord = revision
      ? await this.revisionsRepository.findOne({ filter: { pageSchemaUid: page.pageSchemaUid, revision } })
      : undefined;
    const revisionData = toJson(revisionRecord);
    if (!revisionData) {
      this.fail(ctx, 404, 'revision_not_found', 'Revision not found');
      return;
    }
    await this.writeDraft(
      ctx,
      page.pageSchemaUid,
      page.data,
      getString(revisionData.code) || '',
      getNumber(page.data.draftRevision),
      ctx.t('Rollback to revision {{revision}}', {
        ns: '@nocobase/plugin-ai-page',
        revision,
      }),
    );
  };

  createSession = async (ctx: Context) => {
    const page = await this.requirePage(ctx);
    if (!page) {
      return;
    }
    const sessionId = `${page.pageSchemaUid}-${randomUUID()}`;
    const pairingCode = randomBytes(5).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    await this.sessions.create({
      values: {
        sessionId,
        pageSchemaUid: page.pageSchemaUid,
        pairingCodeHash: hashSecret(pairingCode),
        status: 'pending',
        expiresAt,
      },
    });
    this.respond(
      ctx,
      {
        sessionId,
        pageSchemaUid: page.pageSchemaUid,
        pairingCode,
        expiresAt: expiresAt.toISOString(),
        apiBaseUrl: getHttpState(ctx).publicBasePath,
      },
      201,
    );
  };

  pair = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    const pairingCode = getString(getBody(ctx).pairingCode);
    const record = await this.sessions.findOne({ filter: { sessionId } });
    const data = toJson(record);
    const expiresAt = data?.expiresAt ? new Date(String(data.expiresAt)).getTime() : 0;
    if (
      !record ||
      !pairingCode ||
      data?.status !== 'pending' ||
      data.pairingCodeHash !== hashSecret(pairingCode) ||
      expiresAt <= Date.now()
    ) {
      this.fail(ctx, 401, 'pairing_failed', 'The pairing code is invalid or expired');
      return;
    }
    const accessToken = `aip_${randomBytes(32).toString('base64url')}`;
    await this.sessions.update({
      filter: { sessionId },
      values: {
        accessTokenHash: hashSecret(accessToken),
        pairingCodeHash: null,
        status: 'paired',
        lastSeenAt: new Date(),
      },
    });
    this.eventHub.emit(sessionId, {
      type: 'agent.connected',
      pageSchemaUid: String(data?.pageSchemaUid || ''),
    });
    this.respond(ctx, {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: new Date(expiresAt).toISOString(),
      pageSchemaUid: data?.pageSchemaUid,
    });
  };

  events = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    const record = await this.sessions.findOne({ filter: { sessionId } });
    const data = toJson(record);
    if (!data) {
      this.fail(ctx, 404, 'session_not_found', 'Agent session not found');
      return;
    }
    ctx.withoutDataWrapping = true;
    ctx.respond = false;
    ctx.status = 200;
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    ctx.res.write(`data: ${JSON.stringify({ type: 'session.ready', pageSchemaUid: data.pageSchemaUid })}\n\n`);

    await new Promise<void>((resolve) => {
      const unsubscribe = this.eventHub.subscribe(sessionId, String(data.pageSchemaUid || ''), (event) => {
        ctx.res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
      const heartbeat = setInterval(() => ctx.res.write(': heartbeat\n\n'), 15_000);
      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        resolve();
      };
      ctx.req.once('aborted', close);
      ctx.res.once('close', close);
    });
  };

  agentEvents = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, undefined, sessionId))) {
      return;
    }
    await this.events(ctx);
  };

  closeSession = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    const record = await this.sessions.findOne({ filter: { sessionId } });
    const data = toJson(record);
    if (!data) {
      this.fail(ctx, 404, 'session_not_found', 'Agent session not found');
      return;
    }
    await this.sessions.update({
      filter: { sessionId },
      values: {
        status: 'closed',
        pairingCodeHash: null,
        accessTokenHash: null,
      },
    });
    this.eventHub.emit(sessionId, {
      type: 'session.closed',
      pageSchemaUid: String(data.pageSchemaUid || ''),
    });
    this.respond(ctx, { success: true });
  };

  agentCloseSession = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    if (!(await this.validateAgent(ctx, undefined, sessionId))) {
      return;
    }
    await this.closeSession(ctx);
  };

  runtimeResult = async (ctx: Context) => {
    const { sessionId } = getHttpState(ctx).params;
    const record = await this.sessions.findOne({ filter: { sessionId } });
    const data = toJson(record);
    if (!data) {
      this.fail(ctx, 404, 'session_not_found', 'Agent session not found');
      return;
    }
    this.eventHub.emit(sessionId, {
      type: 'runtime.result',
      pageSchemaUid: String(data.pageSchemaUid || ''),
      body: getBody(ctx),
    });
    this.respond(ctx, { success: true });
  };
}
