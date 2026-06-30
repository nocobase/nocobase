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
import agAgentProfiles from '../collections/agAgentProfiles';
import agApiCallLogs from '../collections/agApiCallLogs';
import agDispatchBindings from '../collections/agDispatchBindings';
import agNodeInvitations from '../collections/agNodeInvitations';
import agNodeSkillInstalls from '../collections/agNodeSkillInstalls';
import agNodes from '../collections/agNodes';
import agPromptTemplates from '../collections/agPromptTemplates';
import agRunArtifacts, { AG_RUN_ARTIFACT_UNIQUE_CONSTRAINT_NOTE } from '../collections/agRunArtifacts';
import agRunEvents from '../collections/agRunEvents';
import agRuns from '../collections/agRuns';
import agRunSnapshots from '../collections/agRunSnapshots';
import agSkills from '../collections/agSkills';
import agSkillVersions from '../collections/agSkillVersions';

const collections = [
  agNodes,
  agNodeInvitations,
  agAgentProfiles,
  agSkills,
  agSkillVersions,
  agNodeSkillInstalls,
  agPromptTemplates,
  agDispatchBindings,
  agRuns,
  agRunEvents,
  agRunArtifacts,
  agRunSnapshots,
  agApiCallLogs,
] as CollectionOptions[];

const collectionByName = new Map(collections.map((collection) => [collection.name, collection]));

const requiredCollectionNames = [
  'agNodes',
  'agNodeInvitations',
  'agAgentProfiles',
  'agSkills',
  'agSkillVersions',
  'agNodeSkillInstalls',
  'agPromptTemplates',
  'agDispatchBindings',
  'agRuns',
  'agRunEvents',
  'agRunArtifacts',
  'agRunSnapshots',
  'agApiCallLogs',
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

const hasUniqueIndex = (collectionName: string, fields: string[]) =>
  collectionByName
    .get(collectionName)
    ?.indexes?.some((index) => index.unique === true && JSON.stringify(index.fields) === JSON.stringify(fields)) ===
  true;

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
    expect(hasUniqueIndex('agSkillVersions', ['skillId', 'versionLabel'])).toBe(true);
    expect(hasUniqueIndex('agNodeSkillInstalls', ['nodeId', 'skillVersionId'])).toBe(true);
    expect(getField('agPromptTemplates', 'templateKey')?.unique).toBe(true);
    expect(getField('agRuns', 'runCode')?.unique).toBe(true);
    expect(hasUniqueIndex('agRunEvents', ['runId', 'claimAttempt', 'source', 'sequence'])).toBe(true);
    expect(hasUniqueIndex('agRunArtifacts', ['runId', 'claimAttempt', 'artifactKey'])).toBe(true);
    expect(AG_RUN_ARTIFACT_UNIQUE_CONSTRAINT_NOTE).toContain('artifactKey is present');
  });

  it('marks required relation keys and claim attempts as non-nullable', () => {
    expectRequiredForeignKey('agAgentProfiles', 'nodeId');
    expectRequiredForeignKey('agSkillVersions', 'skillId');
    expectRequiredForeignKey('agNodeSkillInstalls', 'nodeId');
    expectRequiredForeignKey('agNodeSkillInstalls', 'skillVersionId');
    expectRequiredForeignKey('agRunEvents', 'runId');
    expectRequiredField('agRunEvents', 'claimAttempt');
    expectRequiredForeignKey('agRunArtifacts', 'runId');
    expectRequiredField('agRunArtifacts', 'claimAttempt');
    expectRequiredForeignKey('agRunSnapshots', 'runId');
    expectRequiredField('agRunSnapshots', 'claimAttempt');
    expect(getField('agApiCallLogs', 'runId')).toBeTruthy();
  });

  it('keeps agent profiles free of raw execution configuration fields', () => {
    const profileFields = fieldNamesOf('agAgentProfiles');

    expect(profileFields).toEqual(
      expect.arrayContaining([
        'profileKey',
        'agentType',
        'driver',
        'capabilitiesJson',
        'runtimeSnapshotJson',
        'trustedConfigJson',
      ]),
    );
    expect(profileFields).not.toEqual(expect.arrayContaining(['command', 'commandPath', 'cwd', 'env']));
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
        'errorSummary',
        'finishedAt',
      ]),
    );
    expectRequiredField('agRuns', 'status');
    expectRequiredField('agRuns', 'claimAttempt');
    expectRequiredField('agRuns', 'leaseVersion');
    expectRequiredField('agRuns', 'cancelRequested');

    expect(fieldNamesOf('agRunArtifacts')).toEqual(
      expect.arrayContaining(['contentText', 'artifactType', 'mimeType', 'sizeBytes', 'metadataJson']),
    );
  });

  it('keeps token persistence fields hash-only with last-four fingerprints', () => {
    expect(fieldNamesOf('agNodeInvitations')).toEqual(expect.arrayContaining(['tokenHash', 'tokenLast4']));
    expect(fieldNamesOf('agNodes')).toEqual(expect.arrayContaining(['nodeTokenHash', 'tokenLast4']));
    expect(fieldNamesOf('agRuns')).toEqual(expect.arrayContaining(['claimTokenHash', 'claimTokenLast4']));

    expect(getField('agNodeInvitations', 'tokenHash')?.hidden).toBe(true);
    expect(getField('agNodes', 'nodeTokenHash')?.hidden).toBe(true);
    expect(getField('agRuns', 'claimTokenHash')?.hidden).toBe(true);

    for (const collectionName of ['agNodeInvitations', 'agNodes', 'agRuns']) {
      expect(fieldNamesOf(collectionName)).not.toEqual(expect.arrayContaining(['token', 'nodeToken', 'claimToken']));
    }
  });

  it('defines retention defaults', () => {
    expect(AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS).toEqual({
      events: 30,
      apiCallLogs: 30,
      artifacts: 90,
      snapshots: 90,
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

      await db.sync();

      for (const [collectionName, fieldName] of [
        ['agAgentProfiles', 'nodeId'],
        ['agSkillVersions', 'skillId'],
        ['agNodeSkillInstalls', 'nodeId'],
        ['agNodeSkillInstalls', 'skillVersionId'],
        ['agRunEvents', 'runId'],
        ['agRunEvents', 'claimAttempt'],
        ['agRunArtifacts', 'runId'],
        ['agRunArtifacts', 'claimAttempt'],
        ['agRunSnapshots', 'runId'],
        ['agRunSnapshots', 'claimAttempt'],
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

      await db.getCollection('agRunEvents').model.create({
        runId,
        claimAttempt: 0,
        source: 'runner',
        sequence: 1,
        eventType: 'log',
      });
      await expect(
        db.getCollection('agRunEvents').model.create({
          claimAttempt: 0,
          source: 'runner',
          sequence: 2,
          eventType: 'log',
        }),
      ).rejects.toThrow();
      await expect(
        db.getCollection('agRunEvents').model.create({
          runId,
          claimAttempt: 0,
          source: 'runner',
          sequence: 1,
          eventType: 'log',
        }),
      ).rejects.toThrow();

      await db.getCollection('agRunArtifacts').model.create({
        runId,
        claimAttempt: 0,
        artifactKey: 'main',
        artifactType: 'text',
      });
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
