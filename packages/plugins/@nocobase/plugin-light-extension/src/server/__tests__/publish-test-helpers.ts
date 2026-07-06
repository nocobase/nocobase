/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import type {
  LightExtensionPulledFile,
  LightExtensionRepoRecord,
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionPublicationService } from '../services/LightExtensionPublicationService';
import { LightExtensionPublishService } from '../services/LightExtensionPublishService';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

export function createPublishService(
  db: Database,
  fileService: LightExtensionFileService,
): LightExtensionPublishService {
  const auditService = new LightExtensionAuditService(db);
  vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
  const permissionService = new LightExtensionPermissionService(auditService);
  const compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  const publicationService = new LightExtensionPublicationService(db);

  return new LightExtensionPublishService(
    db,
    fileService,
    permissionService,
    compilerBridge,
    publicationService,
    undefined,
    auditService,
  );
}

export function createDbStub(entries: Record<string, unknown>[], existingPublication?: Record<string, unknown>) {
  let publicationSeq = 0;
  const entriesRepository = {
    find: vi.fn().mockResolvedValue(entries.map(createModel)),
  };
  const reposRepository = {
    update: vi.fn().mockResolvedValue(undefined),
  };
  const logsRepository = {
    create: vi.fn().mockResolvedValue(createModel({})),
  };
  const publicationsRepository = {
    findOne: vi.fn().mockResolvedValue(existingPublication ? createModel(existingPublication) : null),
    create: vi.fn().mockImplementation((input: { values: Record<string, unknown> }) => {
      publicationSeq += 1;
      return Promise.resolve(
        createModel({
          ...input.values,
          id: `lep_created_${publicationSeq}`,
        }),
      );
    }),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntries') {
        return entriesRepository;
      }
      if (name === 'lightExtensionRepos') {
        return reposRepository;
      }
      if (name === 'lightExtensionEntryPublications') {
        return publicationsRepository;
      }
      if (name === 'lightExtensionLogs') {
        return logsRepository;
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;

  return {
    db,
    entriesRepository,
    reposRepository,
    logsRepository,
    publicationsRepository,
  };
}

export function createFileServiceStub(repo: LightExtensionRepoRecord, files: LightExtensionTreeEntryInput[]) {
  const pulledFiles: LightExtensionPulledFile[] = files.map((file) => ({
    path: file.path,
    pathHash: `${file.path}:hash`,
    pathLowerHash: `${file.path.toLowerCase()}:hash`,
    blobHash: `${file.path}:blob`,
    size: file.content?.length || 0,
    language: file.language || 'typescript',
    mode: file.mode || '100644',
    content: file.content,
  }));

  return {
    pull: vi.fn().mockResolvedValue({
      repo,
      commit: {
        id: 'vsc_commit_1',
      },
      tree: {
        hash: 'tree_hash_1',
        entryCount: pulledFiles.length,
        byteSize: pulledFiles.reduce((total, file) => total + file.size, 0),
      },
      unchanged: false,
      files: pulledFiles,
    }),
  } as unknown as LightExtensionFileService;
}

export function createRepo(input: Partial<LightExtensionRepoRecord> = {}): LightExtensionRepoRecord {
  return {
    id: 'ler_sales',
    name: 'Sales',
    normalizedName: 'sales',
    title: 'Sales',
    description: null,
    version: 1,
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: 'vsc_commit_1',
    ...input,
  };
}

export function createEntryRecord(input: {
  id: string;
  repoId: string;
  entryName: string;
  healthStatus?: string;
}): Record<string, unknown> {
  return {
    id: input.id,
    repoId: input.repoId,
    target: 'client',
    kind: 'js-block',
    entryName: input.entryName,
    entryPath: `src/client/js-blocks/${input.entryName}/index.tsx`,
    metaPath: null,
    settingsPath: null,
    title: input.entryName,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          default: 5,
        },
      },
    },
    activePublicationId: null,
    healthStatus: input.healthStatus || 'ready',
    diagnostics: [],
    validatorVersion: 'test',
    lastScannedCommitId: 'vsc_commit_1',
    lastScannedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

export function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}

export function validSalesKpiFiles(): LightExtensionTreeEntryInput[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: "const title = 'Sales KPI';\nctx.render(<div>{title}</div>);\n",
    },
    {
      path: 'src/client/js-blocks/sales-kpi/settings.json',
      content: JSON.stringify({
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            default: 5,
          },
        },
      }),
    },
  ];
}
