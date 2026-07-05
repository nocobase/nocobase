/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { promisify } from 'util';

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
  getModelNumber,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getPositiveInteger,
  getRecord,
  getString,
  requireManagePermission,
} from './utils';
import { getExplicitAgentProviderKey, normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';

const DEFAULT_INVITATION_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30;
const DEFAULT_CLAIM_INTERVAL_SECONDS = 10;
const NODE_ONLINE_THRESHOLD_MS = 120_000;
const PLUGIN_PACKAGE_ROOT = resolve(__dirname, '../../..');
const BOOTSTRAP_SCRIPT_PATH = resolve(__dirname, '../../../scripts/install-agent-gateway-daemon.sh');
const RAW_PROFILE_CONFIG_KEYS = new Set(['command', 'commandPath', 'cwd', 'env']);
const SAME_HOST_NODE_SUPERSEDED_REASON = 'same-host-node-replaced';
const execFileAsync = promisify(execFile);

function getServerUrl(ctx: Context, values: JsonRecord = {}) {
  const providedServerUrl = getString(values.serverUrl).replace(/\/$/, '');
  if (providedServerUrl) {
    return validateServerUrl(ctx, providedServerUrl);
  }

  const forwardedProto = getString(ctx.get('x-forwarded-proto')).split(',')[0]?.trim();
  const protocol = forwardedProto || getString(ctx.protocol) || 'http';
  const host = normalizeDevelopmentProxyHost(
    ctx,
    getString(ctx.get('x-forwarded-host')) || getString(ctx.host) || getString(ctx.get('host')),
  );
  if (!host) {
    ctx.throw(400, 'Cannot build Agent Gateway server URL without request host');
  }

  return validateServerUrl(ctx, `${protocol}://${host}`.replace(/\/$/, ''));
}

function normalizeDevelopmentProxyHost(ctx: Context, host: string) {
  const appPort = getString(process.env.APP_PORT);
  const localPort = ctx.req.socket.localPort;
  if (!host || !appPort || !localPort) {
    return host;
  }

  try {
    const parsedUrl = new URL(`http://${host}`);
    if (parsedUrl.port !== appPort || parsedUrl.port === String(localPort)) {
      return host;
    }

    parsedUrl.port = String(localPort);
    return parsedUrl.host;
  } catch {
    return host;
  }
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

function getBootstrapScriptUrl(serverUrl: string) {
  return `${serverUrl}${API_PREFIX}/bootstrap.sh`;
}

function buildBootstrapCommand(options: { serverUrl: string; nodeKey: string; inviteToken: string }) {
  return [
    `curl -fsSL ${shellQuote(getBootstrapScriptUrl(options.serverUrl))} |`,
    `AGENT_GATEWAY_SERVER_URL=${shellQuote(options.serverUrl)}`,
    `AGENT_GATEWAY_NODE_KEY=${shellQuote(options.nodeKey)}`,
    `AGENT_GATEWAY_INVITE_TOKEN=${shellQuote(options.inviteToken)}`,
    'bash',
  ].join(' ');
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

function getDateFromModel(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNodeOnlineReason(node: ModelRecord, now = new Date()) {
  if (getModelString(node, 'status') !== 'active') {
    return 'node-disabled';
  }

  const lastHeartbeatAt = getDateFromModel(node, 'lastHeartbeatAt');
  if (!lastHeartbeatAt) {
    return 'missing-heartbeat';
  }

  if (now.getTime() - lastHeartbeatAt.getTime() > NODE_ONLINE_THRESHOLD_MS) {
    return 'heartbeat-stale';
  }

  return null;
}

function serializeNode(node: ModelRecord, now = new Date()) {
  const json = getModelJson(node);
  delete json.nodeTokenHash;
  const onlineReason = getNodeOnlineReason(node, now);
  return {
    ...json,
    online: !onlineReason,
    onlineReason,
  };
}

function getHostIdentity(metadataJson: JsonRecord) {
  const hostInfo = getRecord(metadataJson.hostInfo);
  const hostname = getString(hostInfo.hostname).toLowerCase();
  const hostPlatform = getString(hostInfo.platform).toLowerCase();
  const hostArch = getString(hostInfo.arch).toLowerCase();
  if (!hostname || !hostPlatform || !hostArch) {
    return '';
  }
  return [hostname, hostPlatform, hostArch].join('/');
}

function isSupersededNode(node: ModelRecord) {
  const metadataJson = getRecord(getModelValue(node, 'metadataJson'));
  return getString(metadataJson.supersededReason) === SAME_HOST_NODE_SUPERSEDED_REASON;
}

function serializeProfile(profile: ModelRecord) {
  const json = getModelJson(profile);
  delete json.trustedConfigJson;
  return json;
}

function getNodeStatus(ctx: Context, value: unknown) {
  const status = getString(value);
  if (status !== 'active' && status !== 'disabled') {
    ctx.throw(400, 'Node status must be active or disabled');
  }
  return status;
}

async function createInvitation(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const expectedNodeKey = getString(values.expectedNodeKey || values.nodeKey);
  if (!expectedNodeKey) {
    ctx.throw(400, 'Node key is required');
  }

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
      expectedNodeKey: expectedNodeKey || null,
      maxUses: 1,
      usedCount: 0,
      expiresAt,
      scopesJson: getRecord(values.scopesJson || values.scopes),
      metadataJson: getRecord(values.metadataJson || values.metadata),
    },
  })) as ModelRecord;
  const bootstrapCommand = buildBootstrapCommand({
    serverUrl,
    nodeKey: expectedNodeKey,
    inviteToken: invitationToken.token,
  });

  ctx.body = {
    invitationId: getModelValue(invitation, 'id'),
    invitationKey,
    bootstrapCommand,
    registerCommand: bootstrapCommand,
    expiresAt: expiresAt.toISOString(),
    tokenLast4: invitationToken.tokenLast4,
  };
}

async function serveBootstrapScript(ctx: Context) {
  ctx.withoutDataWrapping = true;
  ctx.type = 'application/x-sh';
  ctx.set('Cache-Control', 'no-store');
  ctx.body = await readFile(BOOTSTRAP_SCRIPT_PATH, 'utf8');
}

async function createDaemonPackage() {
  const tempDir = await mkdtemp(resolve(tmpdir(), 'agent-gateway-daemon-package-'));
  try {
    const { stdout } = await execFileAsync(
      'npm',
      ['pack', PLUGIN_PACKAGE_ROOT, '--pack-destination', tempDir, '--json'],
      {
        cwd: PLUGIN_PACKAGE_ROOT,
        maxBuffer: 1024 * 1024 * 4,
      },
    );
    const packages = JSON.parse(stdout || '[]') as Array<{ filename?: string }>;
    const filename = getString(packages[0]?.filename);
    if (!filename) {
      throw new Error('npm pack did not return an Agent Gateway daemon package filename');
    }
    return await readFile(resolve(tempDir, filename));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function serveDaemonPackage(ctx: Context) {
  ctx.withoutDataWrapping = true;
  ctx.type = 'application/gzip';
  ctx.set('Cache-Control', 'no-store');
  ctx.set('Content-Disposition', 'attachment; filename="agent-gateway-daemon.tgz"');
  ctx.body = await createDaemonPackage();
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

async function findReusableSameHostNode(ctx: Context, metadataJson: JsonRecord, transaction: Transaction) {
  const hostIdentity = getHostIdentity(metadataJson);
  if (!hostIdentity) {
    return null;
  }

  const nodes = (await ctx.db.getRepository('agNodes').find({
    filter: {
      status: 'active',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord[];
  return nodes.find((node) => getHostIdentity(getRecord(getModelValue(node, 'metadataJson'))) === hostIdentity) || null;
}

async function markSameHostNodesSuperseded(
  ctx: Context,
  currentNodeId: unknown,
  metadataJson: JsonRecord,
  transaction?: Transaction,
) {
  const hostIdentity = getHostIdentity(metadataJson);
  if (!hostIdentity) {
    return;
  }

  const nodes = (await ctx.db.getRepository('agNodes').find({
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  })) as ModelRecord[];
  const now = new Date();
  for (const node of nodes) {
    const nodeId = getModelTargetKey(node, 'id');
    if (String(nodeId) === String(currentNodeId)) {
      continue;
    }
    const nodeMetadataJson = getRecord(getModelValue(node, 'metadataJson'));
    const sameHost = getHostIdentity(nodeMetadataJson) === hostIdentity;
    const supersededByCurrentNode =
      getString(nodeMetadataJson.supersededReason) === SAME_HOST_NODE_SUPERSEDED_REASON &&
      getString(nodeMetadataJson.supersededByNodeId) === String(currentNodeId);
    const activeSameHostNode = getModelString(node, 'status') === 'active' && sameHost;
    if (!activeSameHostNode && !supersededByCurrentNode) {
      continue;
    }

    if (activeSameHostNode) {
      await ctx.db.getRepository('agNodes').update({
        filterByTk: nodeId,
        values: {
          status: 'disabled',
          disabledAt: now,
          metadataJson: {
            ...nodeMetadataJson,
            supersededAt: now.toISOString(),
            supersededByNodeId: String(currentNodeId),
            supersededReason: SAME_HOST_NODE_SUPERSEDED_REASON,
          },
        },
        transaction,
      });
    }

    await rerouteQueuedRunsFromSupersededNode(ctx, {
      fromNodeId: String(nodeId),
      toNodeId: String(currentNodeId),
      transaction,
    });
  }
}

async function appendRunReroutedEvent(
  ctx: Context,
  options: {
    run: ModelRecord;
    fromNodeId: string;
    toNodeId: string;
    fromProfileId: string;
    toProfileId: string;
    transaction?: Transaction;
  },
) {
  const runId = String(getModelTargetKey(options.run, 'id'));
  const latestEvent = (await ctx.db.getRepository('agRunEvents').findOne({
    filter: {
      runId,
      source: 'agent-gateway',
    },
    sort: ['-sequence'],
    transaction: options.transaction,
    lock: options.transaction ? options.transaction.LOCK.UPDATE : undefined,
  })) as ModelRecord | null;
  await ctx.db.getRepository('agRunEvents').create({
    values: {
      id: randomUUID(),
      runId,
      claimAttempt: getModelNumber(options.run, 'claimAttempt'),
      source: 'agent-gateway',
      sequence: (latestEvent ? getModelNumber(latestEvent, 'sequence') : 0) + 1,
      level: 'info',
      eventType: 'run.rerouted',
      message: 'Run rerouted to replacement same-host node',
      payloadJson: {
        fromNodeId: options.fromNodeId,
        toNodeId: options.toNodeId,
        fromProfileId: options.fromProfileId,
        toProfileId: options.toProfileId,
        reason: SAME_HOST_NODE_SUPERSEDED_REASON,
      },
      emittedAt: new Date(),
    },
    transaction: options.transaction,
  });
}

async function rerouteQueuedRunsFromSupersededNode(
  ctx: Context,
  options: {
    fromNodeId: string;
    toNodeId: string;
    transaction?: Transaction;
  },
) {
  const queuedRuns = (await ctx.db.getRepository('agRuns').find({
    filter: {
      nodeId: options.fromNodeId,
      status: 'queued',
    },
    transaction: options.transaction,
    lock: options.transaction ? options.transaction.LOCK.UPDATE : undefined,
  })) as ModelRecord[];

  for (const run of queuedRuns) {
    const oldProfileId = getModelTargetKey(run, 'agentProfileId');
    if (!oldProfileId) {
      continue;
    }

    const oldProfile = (await ctx.db.getRepository('agAgentProfiles').findOne({
      filterByTk: oldProfileId,
      transaction: options.transaction,
    })) as ModelRecord | null;
    if (!oldProfile) {
      continue;
    }

    const newProfile = (await ctx.db.getRepository('agAgentProfiles').findOne({
      filter: {
        nodeId: options.toNodeId,
        profileKey: getModelString(oldProfile, 'profileKey'),
        provider: getModelString(oldProfile, 'provider'),
        status: 'active',
      },
      transaction: options.transaction,
    })) as ModelRecord | null;
    if (!newProfile) {
      continue;
    }

    const newProfileId = String(getModelTargetKey(newProfile, 'id'));
    await ctx.db.getRepository('agRuns').update({
      filterByTk: getModelTargetKey(run, 'id'),
      values: {
        nodeId: options.toNodeId,
        agentProfileId: newProfileId,
      },
      transaction: options.transaction,
    });
    await appendRunReroutedEvent(ctx, {
      run,
      fromNodeId: options.fromNodeId,
      toNodeId: options.toNodeId,
      fromProfileId: String(oldProfileId),
      toProfileId: newProfileId,
      transaction: options.transaction,
    });
  }
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
    const nodeToken = createNodeToken();
    const now = new Date();
    const metadataJson = {
      daemonVersion: getString(values.daemonVersion) || null,
      hostInfo: getRecord(values.hostInfo),
    };
    const nodeValues = {
      nodeKey,
      displayName: getString(values.displayName) || nodeKey,
      status: 'active',
      endpointUrl: getString(values.endpointUrl) || null,
      authMode: 'node-token',
      ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
      capabilitiesJson: getRecord(values.capabilitiesJson || values.capabilities),
      metadataJson,
      lastHeartbeatAt: now,
      disabledAt: null,
    };
    const existingNodeByKey = (await ctx.db.getRepository('agNodes').findOne({
      filter: {
        nodeKey,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    const existingNode = existingNodeByKey || (await findReusableSameHostNode(ctx, metadataJson, transaction));
    let node: ModelRecord;
    if (existingNode) {
      const nodeId = getModelTargetKey(existingNode, 'id');
      await ctx.db.getRepository('agNodes').update({
        filterByTk: nodeId,
        values: nodeValues,
        transaction,
      });
      const updatedNode = (await ctx.db.getRepository('agNodes').findOne({
        filterByTk: nodeId,
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord | null;
      if (!updatedNode) {
        ctx.throw(404, 'Node not found');
      }
      node = updatedNode;
    } else {
      node = (await ctx.db.getRepository('agNodes').create({
        values: {
          ...nodeValues,
          registeredAt: now,
        },
        transaction,
      })) as ModelRecord;
    }

    await markSameHostNodesSuperseded(ctx, getModelTargetKey(node, 'id'), metadataJson, transaction);

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
    const reportedCapabilities = getRecord(profile.capabilitiesJson || profile.capabilities);
    const explicitProvider =
      getString(profile.provider) || getString(profile.providerKey) || getString(reportedCapabilities.provider);
    const profileProvider = getExplicitAgentProviderKey(explicitProvider);
    if (explicitProvider && !profileProvider) {
      ctx.throw(400, 'Provider is not supported');
    }
    const commandProvider = getExplicitAgentProviderKey(reportedCapabilities.commandKey);
    const provider = profileProvider || commandProvider || 'generic-cli';
    const capabilitiesJson = normalizeAgentProviderCapabilities(provider, reportedCapabilities);
    const profileValues = {
      nodeId,
      profileKey,
      provider,
      displayName: getString(profile.displayName) || profileKey,
      agentType: getString(profile.agentType) || 'code',
      driver: getString(profile.driver) || 'fake',
      status: getString(profile.status) || 'active',
      capabilitiesJson,
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
  await markSameHostNodesSuperseded(ctx, nodeId, metadataJson);

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

  const now = new Date();
  const nodes = (await ctx.db.getRepository('agNodes').find({
    sort: ['-createdAt'],
  })) as ModelRecord[];

  ctx.body = nodes.filter((node) => !isSupersededNode(node)).map((node) => serializeNode(node, now));
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

async function updateNode(ctx: Context, nodeId: string) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const status = getNodeStatus(ctx, values.status);
  const node = (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
  })) as ModelRecord | null;
  if (!node) {
    ctx.throw(404, 'Node not found');
  }

  await ctx.db.getRepository('agNodes').update({
    filterByTk: nodeId,
    values: {
      status,
      disabledAt: status === 'disabled' ? new Date() : null,
    },
  });

  const updatedNode = (await ctx.db.getRepository('agNodes').findOne({
    filterByTk: nodeId,
  })) as ModelRecord | null;
  if (!updatedNode) {
    ctx.throw(404, 'Node not found');
  }

  ctx.body = serializeNode(updatedNode);
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
      const updateNodeMatch = routePath.match(/^\/nodes:update\/([^/]+)$/);
      const listProfilesMatch = routePath.match(/^\/nodes\/([^/]+)\/profiles:list$/);

      if (ctx.method === 'POST' && routePath === '/node-invitations:create') {
        await createInvitation(ctx);
        return;
      }

      if (ctx.method === 'GET' && routePath === '/bootstrap.sh') {
        await serveBootstrapScript(ctx);
        return;
      }

      if (ctx.method === 'GET' && routePath === '/daemon-package.tgz') {
        await serveDaemonPackage(ctx);
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

      if (ctx.method === 'POST' && updateNodeMatch) {
        await updateNode(ctx, updateNodeMatch[1]);
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
