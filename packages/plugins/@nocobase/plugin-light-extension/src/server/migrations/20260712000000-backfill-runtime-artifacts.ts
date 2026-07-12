/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash } from '@nocobase/runjs';
import { Migration } from '@nocobase/server';
import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';

export async function backfillLightExtensionRuntimeArtifacts(db: Database): Promise<void> {
  if (!db.hasCollection('lightExtensionEntries') || !db.hasCollection('lightExtensionRuntimeArtifacts')) {
    return;
  }
  await db.sequelize.transaction(async (transaction) => {
    await backfillEntries(db, transaction);
  });
}

async function backfillEntries(db: Database, transaction: Transaction): Promise<void> {
  const entries = await db.getRepository('lightExtensionEntries').find({
    fields: ['id', 'entryPath', 'runtimeArtifact', 'runtimeCodeHash', 'artifactHash'],
    transaction,
  });
  for (const entry of entries) {
    if (typeof entry.get('artifactHash') === 'string') {
      continue;
    }
    const artifact = toRecord(entry.get('runtimeArtifact'));
    const code = stringValue(artifact.code);
    const version = stringValue(artifact.version);
    const entryPath = stringValue(artifact.entryPath) || stringValue(entry.get('entryPath'));
    if (!code || !version || !entryPath) {
      continue;
    }
    const sourceMap = stringValue(artifact.sourceMap);
    const runtimeCodeHash = stringValue(entry.get('runtimeCodeHash')) || buildRunJSRuntimeCodeHash(code);
    const artifactHash = buildRunJSArtifactHash({
      code,
      sourceMap,
      version,
      entryPath,
      runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    });
    await db.getRepository('lightExtensionRuntimeArtifacts').updateOrCreate({
      filterKeys: ['artifactHash'],
      values: {
        artifactHash,
        runtimeCodeHash,
        code,
        sourceMap: sourceMap || null,
        version,
        entryPath,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
        byteSize: Buffer.byteLength(code, 'utf8') + Buffer.byteLength(sourceMap || '', 'utf8'),
      },
      transaction,
    });
    await entry.update({ artifactHash }, { transaction });
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export default class extends Migration {
  on = 'afterSync';

  async up(): Promise<void> {
    await backfillLightExtensionRuntimeArtifacts(this.db);
  }
}
