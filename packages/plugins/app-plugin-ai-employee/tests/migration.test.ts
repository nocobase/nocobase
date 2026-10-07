import { fileURLToPath } from 'node:url';

import {
  loadMigrations,
  validateMigrations,
  type CollectionBuilder,
} from '@nocobase/db';
import { describe, expect, it } from 'vitest';

const directory = fileURLToPath(
  new URL('../database/migrations', import.meta.url),
);
const migrationName = '202608260002_create_ai_employee';
const migrationFileName = `${migrationName}.ts`;
const storageMigrationName =
  '202608310001_replace_ai_file_storage_id_with_disk';
const removeRecommendedModelsMigrationName =
  '202609010001_remove_recommended_llm_models';
const occurredHourMigrationName =
  '202609300001_add_ai_usage_event_occurred_hour';
const settingsPermissionsMigrationName =
  '202610070001_ai_employee_settings_permissions';
const collectionNames = [
  'aiEmployees',
  'aiMcpClients',
  'llmServices',
  'aiConversations',
  'aiMessages',
  'aiToolMessages',
  'aiFiles',
  'aiSettings',
  'aiUsageEvents',
  'usersAiEmployees',
  'lcCheckpoints',
  'lcCheckpointBlobs',
  'lcCheckpointWrites',
] as const;

async function loadAIEmployeeMigration() {
  const [migration] = await loadMigrations({
    packageName: '@nocobase/app-plugin-ai-employee',
    directory,
  });
  return migration;
}

describe('AI employee migration', () => {
  it('is discoverable and conforms to the migration contract', async () => {
    const migrations = await validateMigrations({
      packageName: '@nocobase/app-plugin-ai-employee',
      directory,
    });

    expect(migrations).toHaveLength(6);
    expect(migrations[0]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: migrationFileName,
      name: migrationName,
    });
    expect(migrations[1]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: `${storageMigrationName}.ts`,
      name: storageMigrationName,
    });
    expect(migrations[1].migration.down).toEqual(expect.any(Function));
    expect(migrations[2]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: `${removeRecommendedModelsMigrationName}.ts`,
      name: removeRecommendedModelsMigrationName,
    });
    expect(migrations[2].migration.irreversible).toBe(true);
    expect(migrations[2].migration.down).toBeUndefined();
    expect(migrations[3]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: '202609230001_add_ai_mcp_tool_permissions.ts',
      name: '202609230001_add_ai_mcp_tool_permissions',
    });
    expect(migrations[3].migration.down).toEqual(expect.any(Function));
    expect(migrations[4]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: `${occurredHourMigrationName}.ts`,
      name: occurredHourMigrationName,
    });
    expect(migrations[4].migration.down).toEqual(expect.any(Function));
    expect(migrations[5]).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee',
      fileName: `${settingsPermissionsMigrationName}.ts`,
      name: settingsPermissionsMigrationName,
    });
    expect(migrations[5].migration.down).toEqual(expect.any(Function));
  });

  it('creates all AI employee collections and drops them in reverse dependency order', async () => {
    const migration = await loadAIEmployeeMigration();
    const created: string[] = [];
    const dropped: string[] = [];
    const builder = {
      createCollection: async (name: string): Promise<void> => {
        created.push(name);
      },
      dropCollection: async (name: string): Promise<void> => {
        dropped.push(name);
      },
    } as unknown as CollectionBuilder;

    await migration.migration.up({
      builder,
      query: undefined!,
      connection: undefined!,
    });
    await migration.migration.down?.({
      builder,
      query: undefined!,
      connection: undefined!,
    });

    expect(created).toEqual(collectionNames);
    expect(dropped).toEqual([...collectionNames].reverse());
  });
});
