/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expectTypeOf } from 'vitest';
import type { Model } from '@nocobase/database';

import type {
  DetachJsTemplateToInlineInput,
  DetachJsTemplateToInlineResult,
  JsTemplate,
  JsTemplateCatalogEntry,
  JsTemplateKind,
  JsTemplateProject,
  JsTemplateRuntimeSourceBinding,
  JsTemplateSelectableTemplateSummary,
  SaveAsJsTemplateInput,
} from '../../shared/types';
import {
  ApplyCompiledTemplatesService,
  DetachJsTemplateToInlineService,
  JsTemplateAuditService,
  JsTemplateCompilePreviewService,
  JsTemplateCompileService,
  JsTemplateCompileWorkerPool,
  JsTemplateError,
  JsTemplatePermissionService,
  JsTemplateProjectService,
  JsTemplateRuntimeService,
  JsTemplateService,
  JsTemplateUsageService,
  JsTemplateValidator,
  JsTemplateWorkspaceCompilerBridge,
  PluginJsTemplateServer,
  SaveAsJsTemplateService,
  buildJsTemplateCapabilities,
  buildJsTemplateArtifactUrl,
  jsTemplateExternalizationCapabilities,
} from '../index';
import type { JsTemplateServiceContext } from '../index';
import { templateFromModel } from '../services/JsTemplateService';

describe('JS Template server public contract', () => {
  it('exports the canonical implementation directly', () => {
    expect(PluginJsTemplateServer.name).toBe('PluginJsTemplateServer');
    expect(JsTemplateAuditService.name).toBe('JsTemplateAuditService');
    expect(JsTemplateCompilePreviewService.name).toBe('JsTemplateCompilePreviewService');
    expect(JsTemplateCompileWorkerPool.name).toBe('JsTemplateCompileWorkerPool');
    expect(JsTemplateProjectService.name).toBe('JsTemplateProjectService');
    expect(JsTemplateService.name).toBe('JsTemplateService');
    expect(JsTemplatePermissionService.name).toBe('JsTemplatePermissionService');
    expect(ApplyCompiledTemplatesService.name).toBe('ApplyCompiledTemplatesService');
    expect(JsTemplateCompileService.name).toBe('JsTemplateCompileService');
    expect(JsTemplateRuntimeService.name).toBe('JsTemplateRuntimeService');
    expect(JsTemplateUsageService.name).toBe('JsTemplateUsageService');
    expect(SaveAsJsTemplateService.name).toBe('SaveAsJsTemplateService');
    expect(DetachJsTemplateToInlineService.name).toBe('DetachJsTemplateToInlineService');
    expect(JsTemplateValidator.name).toBe('JsTemplateValidator');
    expect(JsTemplateWorkspaceCompilerBridge.name).toBe('JsTemplateWorkspaceCompilerBridge');
    expect(JsTemplateError.name).toBe('JsTemplateError');
    expect(buildJsTemplateCapabilities).toBeTypeOf('function');
    expect(buildJsTemplateArtifactUrl).toBeTypeOf('function');
    expect(jsTemplateExternalizationCapabilities.id).toBe('js-template');
    expectTypeOf<JsTemplateProject['id']>().toEqualTypeOf<string>();
    expectTypeOf<JsTemplateServiceContext>().toBeObject();
    expectTypeOf<keyof DetachJsTemplateToInlineInput>().toEqualTypeOf<
      'idempotencyKey' | 'locator' | 'projectId' | 'templateId' | 'expectedProjectHeadCommitId'
    >();
    expectTypeOf<DetachJsTemplateToInlineResult['runtimeVersion']>().toEqualTypeOf<string>();
    expectTypeOf<SaveAsJsTemplateInput['runtimeVersion']>().toEqualTypeOf<string>();
    expectTypeOf<JsTemplate['kind']>().toEqualTypeOf<JsTemplateKind>();
    expectTypeOf<JsTemplateCatalogEntry['kind']>().toEqualTypeOf<JsTemplateKind>();
    expectTypeOf<JsTemplateSelectableTemplateSummary['kind']>().toEqualTypeOf<JsTemplateKind>();
    expectTypeOf<JsTemplateRuntimeSourceBinding['kind']>().toEqualTypeOf<JsTemplateKind>();
  });

  it('rejects an invalid persisted kind at the database-to-domain boundary', () => {
    const record = {
      get: (key: string) => (key === 'kind' ? 'forged-kind' : undefined),
    } as Model;

    expect(() => templateFromModel(record)).toThrow('Unsupported JS Template kind: forged-kind');
  });
});
