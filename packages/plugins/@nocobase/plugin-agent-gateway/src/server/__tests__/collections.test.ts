/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions, createMockDatabase, Database } from '@nocobase/database';

import { AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS } from '../constants';
import agAgentConversationEvents from '../collections/agAgentConversationEvents';
import agAgentProfiles from '../collections/agAgentProfiles';
import agAgentSessions, { AG_AGENT_SESSION_PROVIDER_ID_UNIQUE_CONSTRAINT_NOTE } from '../collections/agAgentSessions';
import agApiCallLogs from '../collections/agApiCallLogs';
import agDispatchBindings from '../collections/agDispatchBindings';
import agExternalImportBatches from '../collections/agExternalImportBatches';
import agExternalRunIdentities from '../collections/agExternalRunIdentities';
import agEventIngestSequences from '../collections/agEventIngestSequences';
import agFileUploads from '../collections/agFileUploads';
import agNodeInvitations from '../collections/agNodeInvitations';
import agNodeSkillInstalls from '../collections/agNodeSkillInstalls';
import agNodes from '../collections/agNodes';
import agPromptTemplates from '../collections/agPromptTemplates';
import agRunArtifacts, { AG_RUN_ARTIFACT_UNIQUE_CONSTRAINT_NOTE } from '../collections/agRunArtifacts';
import agRunControlRequests, {
  AG_RUN_CONTROL_REQUEST_UNIQUE_CONSTRAINT_NOTE,
} from '../collections/agRunControlRequests';
import agRunEvents from '../collections/agRunEvents';
import agRuns from '../collections/agRuns';
import agRunSnapshots from '../collections/agRunSnapshots';
import agSkills from '../collections/agSkills';
import agSkillVersions from '../collections/agSkillVersions';
import agTerminalStreamTickets from '../collections/agTerminalStreamTickets';
import { registerEventIngestCursorHooks } from '../services/eventIngestCursor';

const collections = [
  agNodes,
  agNodeInvitations,
  agAgentProfiles,
  agAgentSessions,
  agEventIngestSequences,
  agAgentConversationEvents,
  agSkills,
  agSkillVersions,
  agNodeSkillInstalls,
  agPromptTemplates,
  agDispatchBindings,
  agExternalRunIdentities,
  agExternalImportBatches,
  agFileUploads,
  agRuns,
  agRunControlRequests,
  agRunEvents,
  agRunArtifacts,
  agRunSnapshots,
  agApiCallLogs,
  agTerminalStreamTickets,
] as CollectionOptions[];

const collectionByName = new Map(collections.map((collection) => [collection.name, collection]));

const requiredCollectionNames = [
  'agNodes',
  'agNodeInvitations',
  'agAgentProfiles',
  'agAgentSessions',
  'agEventIngestSequences',
  'agAgentConversationEvents',
  'agSkills',
  'agSkillVersions',
  'agNodeSkillInstalls',
  'agPromptTemplates',
  'agDispatchBindings',
  'agExternalRunIdentities',
  'agExternalImportBatches',
  'agFileUploads',
  'agRuns',
  'agRunControlRequests',
  'agRunEvents',
  'agRunArtifacts',
  'agRunSnapshots',
  'agApiCallLogs',
  'agTerminalStreamTickets',
];

const fieldNamesOf = (collectionName: string) =>
  (collectionByName.get(collectionName)?.fields || []).map((field) => field.name);

const getField = (collectionName: string, fieldName: string) => {
  const collection = collectionByName.get(collectionName);
  return collection?.fields?.find((field) => field.name === fieldName);
};

const expectRequiredField = (collectionName: string, fieldName: string) => {
  expect(getField(collectionName, fieldName)?.allowNull).toBe(false);
};

const expectRequiredForeignKey = (collectionName: string, fieldName: string) => {
  const field = getField(collectionName, fieldName);

  expect(field?.allowNull).toBe(false);
  expect(field?.autoFill).toBe(false);
};

const expectNullableForeignKey = (collectionName: string, fieldName: string) => {
  const field = getField(collectionName, fieldName);

  expect(field).toBeTruthy();
  expect(field?.allowNull).not.toBe(false);
  expect(field?.autoFill).toBe(false);
};

const hasUniqueIndex = (collectionName: string, fields: string[]) =>
  collectionByName
    .get(collectionName)
    ?.indexes?.some((index) => index.unique === true && JSON.stringify(index.fields) === JSON.stringify(fields)) ===
  true;

const hasIndex = (collectionName: string, fields: string[]) =>
  collectionByName
    .get(collectionName)
    ?.indexes?.some((index) => JSON.stringify(index.fields) === JSON.stringify(fields)) === true;

const syncIt = process.env.DB_DIALECT && process.env.DB_DIALECT !== 'sqlite' ? it : it.skip;

describe('agent gateway collections', () => {
  it('defines the required collections with ag-prefixed physical tables', () => {
    expect(collections.map((collection) => collection.name)).toEqual(requiredCollectionNames);

    for (const collection of collections) {
      expect(collection.tableName).toMatch(/^ag_/);
      expect(collection.autoGenId).toBe(false);
      expect(collection.migrationRules).toContain('schema-only');
    }
  });

  it('defines required unique constraints', () => {
    expect(getField('agNodes', 'nodeKey')?.unique).toBe(true);
    expect(hasUniqueIndex('agAgentProfiles', ['nodeId', 'profileKey'])).toBe(true);
    expect(hasUniqueIndex('agAgentSessions', ['nodeId', 'provider', 'providerSessionId'])).toBe(true);
    expect(hasUniqueIndex('agAgentConversationEvents', ['runId', 'source', 'providerEventId'])).toBe(true);
    expect(hasUniqueIndex('agAgentConversationEvents', ['runId', 'source', 'sequence'])).toBe(true);
    expect(hasUniqueIndex('agAgentConversationEvents', ['runId', 'ingestId'])).toBe(true);
    expect(hasUniqueIndex('agAgentConversationEvents', ['sessionId', 'sessionIngestId'])).toBe(true);
    expect(hasUniqueIndex('agSkillVersions', ['skillId', 'versionLabel'])).toBe(true);
    expect(hasUniqueIndex('agNodeSkillInstalls', ['nodeId', 'skillVersionId'])).toBe(true);
    expect(getField('agPromptTemplates', 'templateKey')?.unique).toBe(true);
    expect(hasUniqueIndex('agExternalRunIdentities', ['identityKey'])).toBe(true);
    expect(hasUniqueIndex('agExternalRunIdentities', ['runId'])).toBe(true);
    expect(hasUniqueIndex('agExternalImportBatches', ['batchIdentityKey'])).toBe(true);
    expect(hasUniqueIndex('agExternalImportBatches', ['runId', 'batchKey'])).toBe(true);
    expect(getField('agRuns', 'runCode')?.unique).toBe(true);
    expect(getField('agRuns', 'continuationRequestKey')?.unique).toBe(true);
    expect(getField('agRunControlRequests', 'requestKey')?.unique).toBe(true);
    expect(hasUniqueIndex('agRunEvents', ['runId', 'claimAttempt', 'source', 'sequence'])).toBe(true);
    expect(hasUniqueIndex('agRunEvents', ['runId', 'ingestId'])).toBe(true);
    expect(hasUniqueIndex('agRunArtifacts', ['runId', 'claimAttempt', 'artifactKey'])).toBe(true);
    expect(hasUniqueIndex('agTerminalStreamTickets', ['ticketHash'])).toBe(true);
    expect(AG_RUN_ARTIFACT_UNIQUE_CONSTRAINT_NOTE).toContain('artifactKey is present');
    expect(AG_AGENT_SESSION_PROVIDER_ID_UNIQUE_CONSTRAINT_NOTE).toContain('providerSessionId is present');
    expect(AG_RUN_CONTROL_REQUEST_UNIQUE_CONSTRAINT_NOTE).toContain('requestKey is present');
  });

  it('defines compound indexes for recovery and retention scans', () => {
    expect(hasIndex('agExternalImportBatches', ['status', 'lastAttemptAt', 'id'])).toBe(true);
    expect(hasIndex('agRuns', ['status', 'updatedAt', 'id'])).toBe(true);
  });

  it('marks required relation keys and claim attempts as non-nullable', () => {
    expectRequiredForeignKey('agAgentProfiles', 'nodeId');
    expectRequiredForeignKey('agSkillVersions', 'skillId');
    expectRequiredForeignKey('agNodeSkillInstalls', 'nodeId');
    expectRequiredForeignKey('agNodeSkillInstalls', 'skillVersionId');
    expectRequiredForeignKey('agExternalRunIdentities', 'runId');
    expectRequiredForeignKey('agExternalImportBatches', 'identityId');
    expectRequiredForeignKey('agExternalImportBatches', 'runId');
    expectRequiredForeignKey('agRunEvents', 'runId');
    expectRequiredField('agRunEvents', 'claimAttempt');
    expectRequiredField('agRunEvents', 'ingestId');
    expectRequiredForeignKey('agRunArtifacts', 'runId');
    expectRequiredField('agRunArtifacts', 'claimAttempt');
    expectRequiredForeignKey('agRunSnapshots', 'runId');
    expectRequiredField('agRunSnapshots', 'claimAttempt');
    expect(getField('agApiCallLogs', 'runId')).toBeTruthy();
    expectNullableForeignKey('agRuns', 'agentSessionId');
    expectNullableForeignKey('agRuns', 'parentRunId');
    expectNullableForeignKey('agRuns', 'resumedFromRunId');
    expectRequiredForeignKey('agRunControlRequests', 'runId');
    expectRequiredField('agRunControlRequests', 'action');
    expectRequiredField('agRunControlRequests', 'status');
    expectNullableForeignKey('agRunControlRequests', 'agentSessionId');
    expectNullableForeignKey('agAgentSessions', 'rootRunId');
    expectNullableForeignKey('agAgentSessions', 'latestRunId');
    expectNullableForeignKey('agAgentSessions', 'nodeId');
    expectRequiredForeignKey('agAgentConversationEvents', 'runId');
    expectRequiredField('agAgentConversationEvents', 'sequence');
    expectRequiredField('agAgentConversationEvents', 'ingestId');
    expectNullableForeignKey('agAgentConversationEvents', 'sessionId');
    expectRequiredForeignKey('agTerminalStreamTickets', 'runId');
    expectRequiredField('agTerminalStreamTickets', 'userId');
    expectRequiredField('agTerminalStreamTickets', 'expiresAt');
  });

  it('keeps agent profiles free of raw execution configuration fields', () => {
    const profileFields = fieldNamesOf('agAgentProfiles');

    expect(profileFields).toEqual(
      expect.arrayContaining([
        'profileKey',
        'provider',
        'agentType',
        'driver',
        'capabilitiesJson',
        'runtimeSnapshotJson',
      ]),
    );
    expect(profileFields).not.toEqual(
      expect.arrayContaining(['command', 'commandPath', 'cwd', 'env', 'trustedConfigJson']),
    );
  });

  it('defines bounded file upload tracking fields', () => {
    expect(fieldNamesOf('agFileUploads')).toEqual(
      expect.arrayContaining(['id', 'purpose', 'status', 'expectedBytes', 'receivedBytes', 'storagePath', 'expiresAt']),
    );
    expectRequiredField('agFileUploads', 'purpose');
    expectRequiredField('agFileUploads', 'status');
    expectRequiredField('agFileUploads', 'expectedBytes');
    expectRequiredField('agFileUploads', 'receivedBytes');
    expectRequiredField('agFileUploads', 'storagePath');
    expectRequiredField('agFileUploads', 'expiresAt');
  });

  it('defines required run and artifact fields', () => {
    expect(fieldNamesOf('agRuns')).toEqual(
      expect.arrayContaining([
        'status',
        'claimAttempt',
        'leaseVersion',
        'claimTokenHash',
        'claimTokenLast4',
        'claimExpiresAt',
        'lastRunHeartbeatAt',
        'cancelRequested',
        'cancelRequestedAt',
        'cancelAckAt',
        'promptSnapshot',
        'executionPayloadJson',
        'resultSummaryJson',
        'observabilityRollupJson',
        'errorSummary',
        'requestedById',
        'requestedBy',
        'finishedAt',
        'terminalBackend',
        'terminalSessionName',
        'terminalStatus',
        'terminalStartedAt',
        'terminalEndedAt',
        'terminalLastActivityAt',
        'terminalExitCode',
        'agentSessionId',
        'parentRunId',
        'resumedFromRunId',
        'continuationReason',
        'continuationMessagePreview',
        'continuationMessageHash',
        'continuationIdempotencyKey',
        'continuationRequestKey',
        'continuationRequestedById',
        'continuationRequestedAt',
        'agentSessionProvider',
        'agentSessionProviderId',
      ]),
    );
    expectRequiredField('agRuns', 'status');
    expectRequiredField('agRuns', 'claimAttempt');
    expectRequiredField('agRuns', 'leaseVersion');
    expectRequiredField('agRuns', 'cancelRequested');

    expect(fieldNamesOf('agRunArtifacts')).toEqual(
      expect.arrayContaining(['contentText', 'artifactType', 'mimeType', 'sizeBytes', 'metadataJson']),
    );
    expect(fieldNamesOf('agRunControlRequests')).toEqual(
      expect.arrayContaining([
        'runId',
        'agentSessionId',
        'action',
        'reason',
        'idempotencyKey',
        'requestKey',
        'requestedById',
        'status',
        'resultMessage',
        'metadataJson',
        'deliveredAt',
        'completedAt',
      ]),
    );
    expect(fieldNamesOf('agAgentSessions')).toEqual(
      expect.arrayContaining([
        'provider',
        'providerSessionId',
        'nodeId',
        'rootRunId',
        'latestRunId',
        'status',
        'capabilitiesJson',
        'metadataJson',
        'createdById',
      ]),
    );
    expect(fieldNamesOf('agAgentConversationEvents')).toEqual(
      expect.arrayContaining([
        'sessionId',
        'runId',
        'ingestId',
        'sessionIngestId',
        'sequence',
        'eventType',
        'source',
        'providerEventId',
        'correlationId',
        'confidence',
        'contentText',
        'contentJson',
        'createdById',
      ]),
    );
    expect(fieldNamesOf('agExternalImportBatches')).toEqual(
      expect.arrayContaining([
        'operationPlanSha256',
        'operationPlanJson',
        'finalizationSha256',
        'finalizationJson',
        'processedOperations',
        'relationUpdated',
      ]),
    );
    expectRequiredField('agAgentSessions', 'provider');
    expectRequiredField('agAgentConversationEvents', 'eventType');
    expectRequiredField('agAgentConversationEvents', 'source');
  });

  it('keeps token persistence fields hash-only with last-four fingerprints', () => {
    expect(fieldNamesOf('agNodeInvitations')).toEqual(expect.arrayContaining(['tokenHash', 'tokenLast4']));
    expect(fieldNamesOf('agNodes')).toEqual(expect.arrayContaining(['nodeTokenHash', 'tokenLast4']));
    expect(fieldNamesOf('agRuns')).toEqual(expect.arrayContaining(['claimTokenHash', 'claimTokenLast4']));

    expect(getField('agNodeInvitations', 'tokenHash')?.hidden).toBe(true);
    expect(getField('agNodes', 'nodeTokenHash')?.hidden).toBe(true);
    expect(getField('agRuns', 'claimTokenHash')?.hidden).toBe(true);
    expect(getField('agRuns', 'claimAttempt')?.hidden).toBe(true);
    expect(getField('agRuns', 'leaseVersion')?.hidden).toBe(true);
    expect(getField('agRuns', 'claimTokenLast4')?.hidden).toBe(true);
    expect(getField('agRuns', 'claimExpiresAt')?.hidden).toBe(true);
    expect(getField('agRuns', 'terminalSessionName')?.hidden).toBe(true);
    expect(getField('agTerminalStreamTickets', 'ticketHash')?.hidden).toBe(true);
    expect(getField('agTerminalStreamTickets', 'ticketProofHash')?.hidden).toBe(true);
    expect(getField('agTerminalStreamTickets', 'authProofHash')?.hidden).toBe(true);
    expect(getField('agTerminalStreamTickets', 'authProofHash')?.defaultValue).toBe('');
    expect(getField('agRuns', 'promptSnapshot')?.hidden).toBe(true);
    expect(getField('agRuns', 'executionPayloadJson')?.hidden).toBe(true);
    expect(getField('agRuns', 'observabilityRollupJson')?.hidden).toBe(true);

    for (const collectionName of ['agNodeInvitations', 'agNodes', 'agRuns', 'agTerminalStreamTickets']) {
      expect(fieldNamesOf(collectionName)).not.toEqual(
        expect.arrayContaining(['token', 'nodeToken', 'claimToken', 'ticket', 'ticketProof', 'authProof']),
      );
    }
  });

  it('defines retention defaults', () => {
    expect(AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS).toEqual({
      events: 30,
      apiCallLogs: 30,
      artifacts: 90,
      snapshots: 90,
      externalImportBatches: 90,
    });
  });

  syncIt('syncs the initial schema and enforces required constraints', async () => {
    let db: Database | undefined;

    try {
      db = await createMockDatabase({});
      await db.clean({ drop: true });

      for (const collection of collections) {
        db.collection(collection);
      }
      registerEventIngestCursorHooks(db);

      await db.sync();

      for (const [collectionName, fieldName] of [
        ['agAgentProfiles', 'nodeId'],
        ['agSkillVersions', 'skillId'],
        ['agNodeSkillInstalls', 'nodeId'],
        ['agNodeSkillInstalls', 'skillVersionId'],
        ['agRunEvents', 'runId'],
        ['agRunEvents', 'claimAttempt'],
        ['agRunEvents', 'ingestId'],
        ['agAgentConversationEvents', 'ingestId'],
        ['agRunArtifacts', 'runId'],
        ['agRunArtifacts', 'claimAttempt'],
        ['agRunSnapshots', 'runId'],
        ['agRunSnapshots', 'claimAttempt'],
        ['agTerminalStreamTickets', 'runId'],
        ['agTerminalStreamTickets', 'userId'],
        ['agTerminalStreamTickets', 'expiresAt'],
      ]) {
        expect(db.getCollection(collectionName).model.rawAttributes[fieldName].allowNull).toBe(false);
      }

      expect(db.getCollection('agApiCallLogs').model.rawAttributes.runId.allowNull).toBe(true);

      const node = await db.getCollection('agNodes').model.create({
        nodeKey: 'node-1',
      });
      const nodeId = node.get('id');

      await db.getCollection('agAgentProfiles').model.create({
        nodeId,
        profileKey: 'profile-1',
        agentType: 'code',
        driver: 'opencode',
      });
      await expect(
        db.getCollection('agAgentProfiles').model.create({
          profileKey: 'profile-1',
          agentType: 'code',
          driver: 'opencode',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agAgentProfiles').model.create({
          nodeId,
          profileKey: 'profile-1',
          agentType: 'code',
          driver: 'opencode',
        }),
      ).rejects.toThrow();

      const skill = await db.getCollection('agSkills').model.create({
        skillKey: 'skill-1',
      });
      const skillId = skill.get('id');
      const skillVersion = await db.getCollection('agSkillVersions').model.create({
        skillId,
        versionLabel: '1.0.0',
      });
      const skillVersionId = skillVersion.get('id');

      await expect(
        db.getCollection('agSkillVersions').model.create({
          versionLabel: '1.0.0',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agSkillVersions').model.create({
          skillId,
          versionLabel: '1.0.0',
        }),
      ).rejects.toThrow();

      await db.getCollection('agNodeSkillInstalls').model.create({
        nodeId,
        skillVersionId,
      });
      await expect(
        db.getCollection('agNodeSkillInstalls').model.create({
          nodeId,
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agNodeSkillInstalls').model.create({
          nodeId,
          skillVersionId,
        }),
      ).rejects.toThrow();

      const run = await db.getCollection('agRuns').model.create({
        runCode: 'run-1',
      });
      const runId = run.get('id');
      expect(run.get('agentSessionId')).toBeFalsy();
      expect(run.get('parentRunId')).toBeFalsy();
      expect(run.get('resumedFromRunId')).toBeFalsy();
      const agentSession = await db.getCollection('agAgentSessions').model.create({
        nodeId,
        provider: 'codex',
        providerSessionId: 'thread-1',
        rootRunId: runId,
        latestRunId: runId,
      });
      await expect(
        db.getCollection('agAgentSessions').model.create({
          nodeId,
          provider: 'codex',
          providerSessionId: 'thread-1',
        }),
      ).rejects.toThrow();
      await db.getCollection('agRuns').model.update(
        {
          agentSessionId: agentSession.get('id'),
          agentSessionProvider: 'codex',
          agentSessionProviderId: 'thread-1',
          continuationRequestKey: 'continue-once',
        },
        {
          where: {
            id: runId,
          },
        },
      );
      await expect(
        db.getCollection('agRuns').model.create({
          runCode: 'run-2',
          continuationRequestKey: 'continue-once',
        }),
      ).rejects.toThrow();

      await db.getRepository('agRunEvents').create({
        values: {
          runId,
          claimAttempt: 0,
          source: 'runner',
          sequence: 1,
          eventType: 'log',
        },
      });
      const storedRunEvent = await db.getCollection('agRunEvents').model.findOne({
        where: {
          runId,
          source: 'runner',
          sequence: 1,
        },
      });
      expect(Number(storedRunEvent?.get('ingestId'))).toBeGreaterThan(0);
      await db.getCollection('agRunEvents').model.update(
        {
          message: 'updated without reallocating the ingest cursor',
        },
        {
          where: {
            id: storedRunEvent?.get('id'),
          },
        },
      );
      const updatedRunEvent = await db.getCollection('agRunEvents').model.findOne({
        where: {
          id: storedRunEvent?.get('id'),
        },
      });
      expect(updatedRunEvent?.get('message')).toBe('updated without reallocating the ingest cursor');
      expect(updatedRunEvent?.get('ingestId')).toBe(storedRunEvent?.get('ingestId'));
      await expect(
        db.getRepository('agRunEvents').create({
          values: {
            claimAttempt: 0,
            source: 'runner',
            sequence: 2,
            eventType: 'log',
          },
        }),
      ).rejects.toThrow();
      await expect(
        db.getRepository('agRunEvents').create({
          values: {
            runId,
            claimAttempt: 0,
            source: 'runner',
            sequence: 1,
            eventType: 'log',
          },
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agRunEvents').model.create({
          runId,
          claimAttempt: 0,
          source: 'runner',
          sequence: 2,
          eventType: 'log',
        }),
      ).rejects.toThrow('requires a transaction');

      await db.getCollection('agRunArtifacts').model.create({
        runId,
        claimAttempt: 0,
        artifactKey: 'main',
        artifactType: 'text',
      });
      await db.getCollection('agRunControlRequests').model.create({
        runId,
        action: 'interrupt',
        status: 'accepted',
        requestKey: 'control-once',
      });
      await expect(
        db.getCollection('agRunControlRequests').model.create({
          action: 'interrupt',
          status: 'accepted',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agRunControlRequests').model.create({
          runId,
          action: 'interrupt',
          status: 'accepted',
          requestKey: 'control-once',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agRunArtifacts').model.create({
          claimAttempt: 0,
          artifactKey: 'detached',
          artifactType: 'text',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agRunArtifacts').model.create({
          runId,
          claimAttempt: 0,
          artifactKey: 'main',
          artifactType: 'text',
        }),
      ).rejects.toThrow();

      await expect(
        db.getCollection('agRunSnapshots').model.create({
          claimAttempt: 0,
          snapshotType: 'progress',
        }),
      ).rejects.toThrow();
      const nodeLevelApiCallLog = await db.getCollection('agApiCallLogs').model.create({
        direction: 'inbound',
      });
      expect(nodeLevelApiCallLog.get('runId')).toBeFalsy();
    } finally {
      await db?.close();
    }
  });
});
