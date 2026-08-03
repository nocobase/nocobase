/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectTypeOf } from 'vitest';

import { LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT } from '../../constants';
import type { LightExtensionRepoRecord } from '../../shared/types';
import {
  JS_TEMPLATE_SERVER_API_ALIASES,
  getJsTemplateLegacyPermissionResource,
  resolveJsTemplateApiAliasPath,
} from '../jsTemplateApiAliases';
import {
  JsTemplateAuditService,
  JsTemplateCompilePreviewService,
  JsTemplateCompileWorkerPool,
  JsTemplateEntryService,
  JsTemplateError,
  JsTemplatePermissionService,
  JsTemplatePublishCompiledEntriesService,
  JsTemplateReferenceService,
  JsTemplateRuntimeCompileService,
  JsTemplateRuntimeResolveService,
  JsTemplateValidator,
  JsTemplateWorkspaceCompilerBridge,
  PluginJsTemplateServer,
  jsTemplateExternalizationCapabilities,
  type JsTemplateRepoRecord,
} from '../jsTemplateDomain';
import { PluginLightExtensionServer } from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { LightExtensionCompileWorkerPool } from '../services/LightExtensionCompileWorkerPool';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { PublishCompiledEntriesService } from '../services/PublishCompiledEntriesService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { ReferenceService } from '../services/ReferenceService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';
import { LightExtensionError } from '../../shared/errors';
import { lightExtensionExternalizationCapabilities } from '../externalizationCapabilities';

describe('JS Template server compatibility contract', () => {
  it('maps every established HTTP resource and action to one canonical alias', () => {
    expect(JS_TEMPLATE_SERVER_API_ALIASES).toEqual([
      {
        canonicalResource: 'jsTemplates',
        legacyPermissionResource: 'lightExtensions',
        actions: ['compilePreview', 'compileWorkspacePreview', 'moveSource', 'moveToInline'],
      },
      {
        canonicalResource: 'jsTemplateRepos',
        legacyPermissionResource: 'lightExtensionRepos',
        actions: [
          'create',
          'list',
          'get',
          'updateMetadata',
          'changeLifecycle',
          'archive',
          'delete',
          'inspectSourceArchive',
        ],
      },
      {
        canonicalResource: 'jsTemplateFiles',
        legacyPermissionResource: 'lightExtensionFiles',
        actions: ['pull', 'pullCommit', 'getFile', 'readArchivedSource', 'saveSource', 'listCommits', 'diff'],
      },
      {
        canonicalResource: 'jsTemplateEntries',
        legacyPermissionResource: 'lightExtensionEntries',
        actions: ['list', 'get', 'listSelectable'],
      },
      {
        canonicalResource: 'jsTemplateReferences',
        legacyPermissionResource: 'lightExtensionReferences',
        actions: ['readReferences', 'rebuildIndex'],
      },
      {
        canonicalResource: 'jsTemplateRuntime',
        legacyPermissionResource: 'lightExtensionRuntime',
        actions: ['resolve', 'getArtifact'],
      },
      {
        canonicalResource: 'jsTemplateCapabilities',
        legacyPermissionResource: 'lightExtensionCapabilities',
        actions: ['get'],
      },
      {
        canonicalResource: 'jsTemplateSync',
        legacyPermissionResource: 'lightExtensionSync',
        actions: ['get', 'configure', 'disconnect', 'testConnection', 'plan', 'pull', 'push', 'createFromGit'],
      },
      {
        canonicalResource: 'jsTemplateCreateJobs',
        legacyPermissionResource: 'lightExtensionCreateJobs',
        actions: ['list', 'dismiss'],
      },
    ]);
    expect(JS_TEMPLATE_SERVER_API_ALIASES.map((alias) => alias.legacyPermissionResource)).toEqual([
      ...LIGHT_EXTENSION_LEGACY_PROTOCOL_CONTRACT.httpResourceNames,
    ]);
  });

  it.each(['/api', '/nested/api'])('rewrites canonical paths to legacy ACL identities under %s', (prefix) => {
    for (const alias of JS_TEMPLATE_SERVER_API_ALIASES) {
      expect(getJsTemplateLegacyPermissionResource(alias.canonicalResource)).toBe(alias.legacyPermissionResource);
      for (const action of alias.actions) {
        expect(resolveJsTemplateApiAliasPath(`${prefix}/${alias.canonicalResource}:${action}`, prefix)).toBe(
          `${prefix}/${alias.legacyPermissionResource}:${action}`,
        );
      }
      const action = alias.actions[0];
      expect(resolveJsTemplateApiAliasPath(`${prefix}/${alias.canonicalResource}:${action}/record%201`, prefix)).toBe(
        `${prefix}/${alias.legacyPermissionResource}:${action}/record%201`,
      );
    }
  });

  it('does not invent aliases for private collections or unknown actions', () => {
    expect(resolveJsTemplateApiAliasPath('/api/jsTemplateLogs:list', '/api')).toBeNull();
    expect(resolveJsTemplateApiAliasPath('/api/jsTemplateMoveOperations:list', '/api')).toBeNull();
    expect(resolveJsTemplateApiAliasPath('/api/jsTemplateRepos:unknown', '/api')).toBeNull();
    expect(resolveJsTemplateApiAliasPath('/api/jsTemplateReposExtra:list', '/api')).toBeNull();
  });

  it('exports canonical server facades as the same legacy implementations', () => {
    expect(PluginJsTemplateServer).toBe(PluginLightExtensionServer);
    expect(JsTemplateAuditService).toBe(LightExtensionAuditService);
    expect(JsTemplateCompilePreviewService).toBe(LightExtensionCompilePreviewService);
    expect(JsTemplateCompileWorkerPool).toBe(LightExtensionCompileWorkerPool);
    expect(JsTemplateEntryService).toBe(LightExtensionEntryService);
    expect(JsTemplatePermissionService).toBe(LightExtensionPermissionService);
    expect(JsTemplatePublishCompiledEntriesService).toBe(PublishCompiledEntriesService);
    expect(JsTemplateRuntimeCompileService).toBe(LightExtensionRuntimeCompileService);
    expect(JsTemplateRuntimeResolveService).toBe(RuntimeResolveService);
    expect(JsTemplateReferenceService).toBe(ReferenceService);
    expect(JsTemplateValidator).toBe(LightExtensionValidator);
    expect(JsTemplateWorkspaceCompilerBridge).toBe(LightExtensionWorkspaceCompilerBridge);
    expect(JsTemplateError).toBe(LightExtensionError);
    expect(jsTemplateExternalizationCapabilities).toBe(lightExtensionExternalizationCapabilities);
    expectTypeOf<JsTemplateRepoRecord>().toEqualTypeOf<LightExtensionRepoRecord>();
  });
});
