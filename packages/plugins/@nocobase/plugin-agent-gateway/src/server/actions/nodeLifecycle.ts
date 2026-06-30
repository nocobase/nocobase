/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import {
  authenticateNodeToken,
  createInvitationToken,
  createNodeToken,
  hashInvitationToken,
  toStoredTokenFields,
  verifyInvitationToken,
} from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getArray,
  getBodyValues,
  getDate,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getPositiveInteger,
  getRecord,
  getString,
  requireManagePermission,
} from './utils';

const DEFAULT_INVITATION_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30;
const DEFAULT_CLAIM_INTERVAL_SECONDS = 10;
const RAW_PROFILE_CONFIG_KEYS = new Set(['command', 'commandPath', 'cwd', 'env']);

function getServerUrl(ctx: Context, values: JsonRecord) {
  const providedServerUrl = getString(values.serverUrl).replace(/\/$/, '');
  if (providedServerUrl) {
    return validateServerUrl(ctx, providedServerUrl);
  }

  return validateServerUrl(ctx, `${ctx.protocol}://${ctx.host}`.replace(/\/$/, ''));
}

function validateServerUrl(ctx: Context, serverUrl: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(serverUrl);
  } catch {
    ctx.throw(400, 'Server URL must be a valid URL');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    ctx.throw(400, 'Server URL must use http or https');
  }

  parsedUrl.hash = '';
  parsedUrl.search = '';
  return parsedUrl.toString().replace(/\/$/, '');
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function getInvitationExpiry(values: JsonRecord) {
  const explicitExpiry = getDate(values.expiresAt);
  if (explicitExpiry) {
    return explicitExpiry;
  }

  const ttlSeconds = getPositiveInteger(values.expiresInSeconds, DEFAULT_INVITATION_TTL_SECONDS);
  return new Date(Date.now() + ttlSeconds * 1000);
}

function sanitizeProfileMetadata(profile: JsonRecord) {
  const metadata = getRecord(profile.metadataJson || profile.metadata);
  const sanitized: JsonRecord = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!RAW_PROFILE_CONFIG_KEYS.has(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function serializeNode(node: ModelRecord) {
  const json = getModelJson(node);
  delete json.nodeTokenHash;
  return json;
}

function serializeProfile(profile: ModelRecord) {
  const json = getModelJson(profile);
  delete json.trustedConfigJson;
  return json;
}

async function createInvitation(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const invitationToken = createInvitationToken();
  const expiresAt = getInvitationExpiry(values);
  const invitationKey = getString(values.invitationKey) || `inv_${randomUUID()}`;
  const serverUrl = getServerUrl(ctx, values);

  const invitation = (await ctx.db.getRepository('agNodeInvitations').create({
    values: {
      invitationKey,
      status: 'pending',
      tokenHash: invitationToken.tokenHash,
      tokenLast4: invitationToken.tokenLast4,
      expectedNodeKey: getString(values.expectedNodeKey) || null,
      maxUses: 1,
      usedCount: 0,
      expiresAt,
      scopesJson: getRecord(values.scopesJson || values.scopes),
      metadataJson: getRecord(values.metadataJson || values.metadata),
    },
  })) as ModelRecord;

  ctx.body = {
    invitationId: getModelValue(invitation, 'id'),
    invitationKey,
    registerCommand: `agent-gateway-daemon register --server-url ${shellQuote(serverUrl)} --invite-token ${shellQuote(
      invitationToken.token,
    )}`,
    expiresAt: expiresAt.toISOString(),
    tokenLast4: invitationToken.tokenLast4,
  };
}

async function validateInvitation(ctx: Context, inviteToken: string, nodeKey: string, transaction: Transaction) {
  const invitation = (await ctx.db.getRepository('agNodeInvitations').findOne({
    filter: {
      tokenHash: hashInvitationToken(inviteToken),
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;

  if (!invitation || !verifyInvitationToken(inviteToken, getModelString(invitation, 'tokenHash'))) {
    ctx.throw(403, 'Invalid invitation token');
  }

  if (getModelString(invitation, 'status') !== 'pending') {
    ctx.throw(403, 'Invitation is not available');
  }

  const expiresAtValue = getModelValue(invitation, 'expiresAt');
  const expiresAt = expiresAtValue ? new Date(String(expiresAtValue)) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    await ctx.db.getRepository('agNodeInvitations').update({
      filterByTk: getModelTargetKey(invitation, 'id'),
      values: {
        status: 'expired',
      },
      transaction,
    });
    ctx.throw(403, 'Invitation has expired');
  }

  const usedCount = Number(getModelValue(invitation, 'usedCount') || 0);
  const maxUses = Number(getModelValue(invitation, 'maxUses') || 1);
  if (usedCount >= maxUses) {
    ctx.throw(403, 'Invitation has already been used');
  }

  const expectedNodeKey = getModelString(invitation, 'expectedNodeKey');
  if (expectedNodeKey && expectedNodeKey !== nodeKey) {
    ctx.throw(403, 'Invitation is not valid for this node');
  }

  return invitation;
}

async function registerNode(ctx: Context) {
  const values = getBodyValues(ctx);
  const inviteToken = getString(values.inviteToken || values.invitationToken);
  const nodeKey = getString(values.nodeKey);

  if (!inviteToken || !nodeKey) {
    ctx.throw(400, 'Invitation token and node key are required');
  }

  const { node, nodeToken } = await ctx.db.sequelize.transaction(async (transaction) => {
    const invitation = await validateInvitation(ctx, inviteToken, nodeKey, transaction);
    const existingNode = await ctx.db.getRepository('agNodes').findOne({
      filter: {
        nodeKey,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existingNode) {
      ctx.throw(409, 'Node key already exists');
    }

    const nodeToken = createNodeToken();
    const now = new Date();
    const node = (await ctx.db.getRepository('agNodes').create({
      values: {
        nodeKey,
        displayName: getString(values.displayName) || nodeKey,
        status: 'active',
        endpointUrl: getString(values.endpointUrl) || null,
        authMode: 'node-token',
        ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
        capabilitiesJson: getRecord(values.capabilitiesJson || values.capabilities),
        metadataJson: {
          daemonVersion: getString(values.daemonVersion) || null,
          hostInfo: getRecord(values.hostInfo),
        },
        registeredAt: now,
        lastHeartbeatAt: now,
      },
      transaction,
    })) as ModelRecord;

    await ctx.db.getRepository('agNodeInvitations').update({
      filterByTk: getModelTargetKey(invitation, 'id'),
      values: {
        status: 'accepted',
        usedCount: Number(getModelValue(invitation, 'usedCount') || 0) + 1,
        acceptedAt: now,
        nodeId: getModelTargetKey(node, 'id'),
      },
      transaction,
    });

    return {
      node,
      nodeToken,
    };
  });

  ctx.body = {
    nodeId: getModelValue(node, 'id'),
    nodeKey,
    nodeToken: nodeToken.token,
    tokenLast4: nodeToken.tokenLast4,
    heartbeatIntervalSeconds: DEFAULT_HEARTBEAT_INTERVAL_SECONDS,
    claimIntervalSeconds: DEFAULT_CLAIM_INTERVAL_SECONDS,
  };
}

async function syncProfiles(ctx: Context, nodeId: unknown, profiles: unknown[], now: Date) {
  const profileRepo = ctx.db.getRepository('agAgentProfiles');
  const reportedProfileKeys = new Set<string>();

  for (const rawProfile of profiles) {
    const profile = getRecord(rawProfile);
    const profileKey = getString(profile.profileKey || profile.key);
    if (!profileKey) {
      ctx.throw(400, 'Profile key is required');
    }

    reportedProfileKeys.add(profileKey);
    const existingProfile = (await profileRepo.findOne({
      filter: {
        nodeId,
        profileKey,
      },
    })) as ModelRecord | null;
    const profileValues = {
      nodeId,
      profileKey,
      displayName: getString(profile.displayName) || profileKey,
      agentType: getString(profile.agentType) || 'code',
      driver: getString(profile.driver) || 'fake',
      status: getString(profile.status) || 'active',
      capabilitiesJson: getRecord(profile.capabilitiesJson || profile.capabilities),
      runtimeSnapshotJson: {
        reportedAt: now.toISOString(),
        status: getString(profile.status) || 'active',
      },
      metadataJson: sanitizeProfileMetadata(profile),
    };

    if (existingProfile) {
      await profileRepo.update({
        filterByTk: getModelTargetKey(existingProfile, 'id'),
        values: profileValues,
      });
      continue;
    }

    await profileRepo.create({
      values: profileValues,
    });
  }

  const existingProfiles = (await profileRepo.find({
    filter: {
      nodeId,
    },
  })) as ModelRecord[];

  for (const profile of existingProfiles) {
    const profileKey = getModelString(profile, 'profileKey');
    if (!reportedProfileKeys.has(profileKey)) {
      await profileRepo.update({
        filterByTk: getModelTargetKey(profile, 'id'),
        values: {
          status: 'inactive',
        },
      });
    }
  }
}

async function heartbeat(ctx: Context, nodeId: string) {
  const auth = await authenticateNodeToken(ctx);
  if (String(auth.subject.nodeId) !== nodeId) {
    ctx.throw(403, 'Node token does not match requested node');
  }

  const values = getBodyValues(ctx);
  const now = new Date();
  const currentMetadata = getRecord(auth.node.get('metadataJson'));
  const currentConcurrency = values.currentConcurrency;
  const profilesProvided = Object.prototype.hasOwnProperty.call(values, 'profiles');
  const metadataJson = {
    ...currentMetadata,
    currentConcurrency: typeof currentConcurrency === 'number' ? currentConcurrency : null,
    daemonVersion: getString(values.daemonVersion) || currentMetadata.daemonVersion || null,
    hostInfo: Object.keys(getRecord(values.hostInfo)).length
      ? getRecord(values.hostInfo)
      : currentMetadata.hostInfo || {},
    heartbeatAt: now.toISOString(),
  };

  await ctx.db.getRepository('agNodes').update({
    filterByTk: nodeId,
    values: {
      status: 'active',
      lastHeartbeatAt: now,
      capabilitiesJson: getRecord(values.capabilitiesJson || values.capabilities),
      metadataJson,
    },
  });
  if (profilesProvided) {
    await syncProfiles(ctx, nodeId, getArray(values.profiles), now);
  }

  ctx.body = {
    nodeId,
    status: 'active',
    heartbeatAt: now.toISOString(),
    heartbeatIntervalSeconds: DEFAULT_HEARTBEAT_INTERVAL_SECONDS,
    claimIntervalSeconds: DEFAULT_CLAIM_INTERVAL_SECONDS,
  };
}

async function listNodes(ctx: Context) {
  await requireManagePermission(ctx);

  const nodes = (await ctx.db.getRepository('agNodes').find({
    sort: ['-createdAt'],
  })) as ModelRecord[];

  ctx.body = nodes.map(serializeNode);
}

async function getNode(ctx: Context, nodeId: string) {
  await requireManagePermission(ctx);

  const node = (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
  })) as ModelRecord | null;
  if (!node) {
    ctx.throw(404, 'Node not found');
  }

  ctx.body = serializeNode(node);
}

async function listProfiles(ctx: Context, nodeId: string) {
  await requireManagePermission(ctx);

  const profiles = (await ctx.db.getRepository('agAgentProfiles').find({
    filter: {
      nodeId,
    },
    sort: ['profileKey'],
  })) as ModelRecord[];

  ctx.body = profiles.map(serializeProfile);
}

export function registerNodeLifecycleRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const heartbeatMatch = routePath.match(/^\/nodes\/([^/]+)\/heartbeat$/);
      const getNodeMatch = routePath.match(/^\/nodes:get\/([^/]+)$/);
      const listProfilesMatch = routePath.match(/^\/nodes\/([^/]+)\/profiles:list$/);

      if (ctx.method === 'POST' && routePath === '/node-invitations:create') {
        await createInvitation(ctx);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/nodes:register') {
        await registerNode(ctx);
        return;
      }

      if (ctx.method === 'POST' && heartbeatMatch) {
        await heartbeat(ctx, heartbeatMatch[1]);
        return;
      }

      if (ctx.method === 'GET' && routePath === '/nodes:list') {
        await listNodes(ctx);
        return;
      }

      if (ctx.method === 'GET' && getNodeMatch) {
        await getNode(ctx, getNodeMatch[1]);
        return;
      }

      if (ctx.method === 'GET' && listProfilesMatch) {
        await listProfiles(ctx, listProfilesMatch[1]);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayNodeLifecycleRoutes',
      after: 'dataWrapping',
      before: 'dataSource',
    },
  );
}
