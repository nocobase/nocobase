/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryScanner } from '../services/LightExtensionEntryScanner';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

describe('plugin-light-extension saveSource runtime compile', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let runtimeResolveService: RuntimeResolveService;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, undefined, validator);
    const fileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      undefined,
      validator,
    );
    const scanner = new LightExtensionEntryScanner(app.db, auditService, fileService, repoService, validator);
    const compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
    runtimeCompileService = new LightExtensionRuntimeCompileService(app.db, fileService, scanner, compilerBridge);
    runtimeResolveService = new RuntimeResolveService(app.db, auditService, permissionService);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('saves source, compiles ready entries, and resolves runtime from the entry current artifact', async () => {
    const repo = await repoService.createRepo({ name: 'Save Source Runtime' });

    const result = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: null,
      message: 'save source runtime',
      files: validSalesKpiFiles(),
    });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: result.compile.entries[0].entryId,
    });
    const runtime = await runtimeResolveService.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        entryId: result.compile.entries[0].entryId,
        kind: 'js-block',
      },
      settings: {
        region: 'EMEA',
      },
    });

    expect(result.compile.status).toBe('success');
    expect(result.diagnostics).toEqual([]);
    expect(entry?.get('compiledCommitId')).toBe(result.commit.id);
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });
    expect(runtime).toMatchObject({
      entryId: result.compile.entries[0].entryId,
      version: 'v2',
      settings: {
        region: 'EMEA',
      },
      cache: {
        immutable: false,
      },
    });
    expect(runtime.code).toContain('Sales KPI');
  });

  it('supports no-change saves and blocks archived repositories', async () => {
    const repo = await repoService.createRepo({ name: 'No Change Save' });
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: null,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });

    const noChange = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: first.commit.id,
      message: 'no change save',
      files: [],
      allowEmptyCommit: true,
    });

    expect(noChange.compile.status).toBe('success');
    expect(noChange.commit.id).toBeTruthy();

    const staleBaseSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: null,
      message: 'save with stale editor base',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'const title = "Updated Sales KPI";\nctx.render(<div>{title}</div>);\n',
          language: 'typescript',
        },
      ],
      allowEmptyCommit: true,
    });

    expect(staleBaseSave.compile.status).toBe('success');
    expect(staleBaseSave.commit.parentCommitId).toBe(noChange.commit.id);

    const archived = await repoService.archiveRepo({
      repoId: repo.id,
      expectedLifecycleStatus: 'enabled',
    });
    await expect(
      runtimeCompileService.saveSource({
        repoId: repo.id,
        baseCommitId: archived.headCommitId,
        message: 'blocked save',
        files: [],
        allowEmptyCommit: true,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
    });
  });

  it('clears the entry current runtime when compile fails after source save', async () => {
    const repo = await repoService.createRepo({ name: 'Failed Runtime Compile' });
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: null,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });

    const failed = await runtimeCompileService.saveSource({
      repoId: repo.id,
      baseCommitId: first.commit.id,
      message: 'broken source',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: "import Missing from './missing';\nctx.render(<Missing />);\n",
          language: 'typescript',
        },
      ],
    });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });

    expect(failed.compile.status).toBe('failed');
    expect(failed.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
        }),
      ]),
    );
    expect(entry?.get('compiledCommitId')).toBeNull();
    expect(entry?.get('runtimeArtifact')).toBeNull();
  });
});

function validSalesKpiFiles() {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'const title = "Sales KPI";\nctx.render(<div>{title}</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/settings.json',
      content: JSON.stringify({
        type: 'object',
        properties: {
          region: {
            type: 'string',
            default: 'APAC',
          },
        },
      }),
      language: 'json',
    },
  ];
}
