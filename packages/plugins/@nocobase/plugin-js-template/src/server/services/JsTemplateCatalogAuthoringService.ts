/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsTemplateError } from '../../shared/errors';
import {
  type JsTemplateCatalogAddTemplateInput,
  type JsTemplateCatalogAddTemplateResult,
} from '../../shared/catalogAuthoring';
import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import { JsTemplateCompileService } from './JsTemplateCompileService';
import { JsTemplateProjectService, type JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateService } from './JsTemplateService';

export class JsTemplateCatalogAuthoringService {
  constructor(
    private readonly projectService: JsTemplateProjectService,
    private readonly templateService: JsTemplateService,
    private readonly runtimeCompileService: JsTemplateCompileService,
  ) {}

  async addTemplate(
    input: JsTemplateCatalogAddTemplateInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateCatalogAddTemplateResult> {
    const projectId = input.destination.projectId;
    const project = await this.projectService.getProject(projectId, ctx);
    assertProjectAcceptsTemplate(project.id, project.lifecycleStatus);

    const templateName = input.templateName.trim();
    const existingTemplates = await this.templateService.listTemplates(projectId, ctx);
    const conflict = existingTemplates.find(
      (template) =>
        template.healthStatus !== 'missing' && template.kind === input.kind && template.templateName === templateName,
    );
    if (conflict) {
      throw new JsTemplateError('JS_TEMPLATE_CONFLICT', 'A JS Template with this kind and name already exists', {
        status: 409,
        details: {
          projectId,
          templateId: conflict.id,
          kind: input.kind,
          templateName,
        },
      });
    }

    let files: ReturnType<typeof createJsTemplateEntryStarter>;
    try {
      files = createJsTemplateEntryStarter({
        kind: input.kind,
        templateName,
        title: input.title,
        description: input.description,
      });
    } catch (error) {
      if (error instanceof RangeError) {
        throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', error.message);
      }
      throw error;
    }

    return this.runtimeCompileService.saveSource(
      {
        projectId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        message: 'Create JS Template entry',
        files,
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'js-template-catalog-add-template',
      },
    );
  }
}

function assertProjectAcceptsTemplate(projectId: string, lifecycleStatus: string): void {
  if (lifecycleStatus === 'enabled') {
    return;
  }
  if (lifecycleStatus === 'archived') {
    throw new JsTemplateError('JS_TEMPLATE_PROJECT_ARCHIVED', 'Archived Source Projects cannot receive JS Templates', {
      status: 409,
      details: { projectId, lifecycleStatus },
    });
  }
  throw new JsTemplateError('JS_TEMPLATE_PROJECT_DISABLED', 'Disabled Source Projects cannot receive JS Templates', {
    status: 409,
    details: { projectId, lifecycleStatus },
  });
}
