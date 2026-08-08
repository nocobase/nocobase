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
import { JsTemplateError } from '../../shared/errors';
import * as packageEntry from '../../index';
import * as serverEntry from '../index';
import { PluginJsTemplateServer } from '../index';
import { jsTemplateExternalizationCapabilities } from '../externalizationCapabilities';
import { ApplyCompiledTemplatesService } from '../services/ApplyCompiledTemplatesService';
import { DetachJsTemplateToInlineService } from '../services/DetachJsTemplateToInlineService';
import { JsTemplateAuditService } from '../services/JsTemplateAuditService';
import { JsTemplateCompilePreviewService } from '../services/JsTemplateCompilePreviewService';
import { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateCompileWorkerPool } from '../services/JsTemplateCompileWorkerPool';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import { JsTemplateProjectService, type JsTemplateServiceContext } from '../services/JsTemplateProjectService';
import { buildJsTemplateArtifactUrl, JsTemplateRuntimeService } from '../services/JsTemplateRuntimeService';
import { JsTemplateService, templateFromModel } from '../services/JsTemplateService';
import { JsTemplateUsageService } from '../services/JsTemplateUsageService';
import { buildJsTemplateCapabilities, JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';
import { SaveAsJsTemplateService } from '../services/SaveAsJsTemplateService';

describe('JS Template server public contract', () => {
  it('keeps the server and package root entries minimal', () => {
    const expectedKeys = ['PluginJsTemplateServer', 'default', 'registerJsTemplateDomainAvailabilityGuard'];
    expect(Object.keys(serverEntry).sort()).toEqual(expectedKeys);
    expect(Object.keys(packageEntry).sort()).toEqual(expectedKeys);
  });

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
