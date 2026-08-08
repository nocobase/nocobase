/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildWrapperFieldChildren,
  type CreateModelOptions,
  type FlowModelContext,
  type SubModelItem,
  type SubModelItemsType,
} from '@nocobase/flow-engine';
import type { RunJSSurfaceMenuItemProvider, RunJSSurfaceMenuItemProviderContext } from '@nocobase/client-v2';
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import { NAMESPACE } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateRunJSPersistence';
import type {
  JsTemplateKind,
  JsTemplateRuntimeSourceBinding,
  JsTemplateSelectableTemplateSummary,
} from '../../shared/types';
import { listSelectableJsTemplates, type ApiClientLike } from '../api/jsTemplatesRequests';

export type JsTemplateModelMenuTarget = 'block' | 'action' | 'field' | 'column';

export type JsTemplateModelMenuOptions =
  | { target: 'block'; modelUse?: string }
  | { target: 'action'; modelUse: string }
  | {
      target: 'field';
      itemModelUse: string;
      fieldModelUse: string;
      refreshTargets: string[];
    }
  | { target: 'column'; modelUse?: string };

const targetKinds: Record<JsTemplateModelMenuTarget, JsTemplateKind> = {
  block: 'js-block',
  action: 'js-action',
  field: 'js-field',
  column: 'js-field',
};

const defaultModelUses: Partial<Record<JsTemplateModelMenuTarget, string>> = {
  block: 'JSBlockModel',
  column: 'JSColumnModel',
};

const ACTION_MODEL_USES = [
  'JSActionModel',
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
] as const;

const FIELD_SURFACE_OPTIONS: Partial<
  Record<Exclude<RunJSSurfaceMenuItemProviderContext['surface'], 'block' | 'action'>, JsTemplateModelMenuOptions>
> = {
  'form-field': {
    target: 'field',
    itemModelUse: 'FormItemModel',
    fieldModelUse: 'JSEditableFieldModel',
    refreshTargets: ['FormItemModel', 'FormJSFieldItemModel'],
  },
  'details-field': {
    target: 'field',
    itemModelUse: 'DetailsItemModel',
    fieldModelUse: 'JSFieldModel',
    refreshTargets: ['DetailsItemModel', 'DetailsJSFieldItemModel'],
  },
  'table-column': { target: 'column', modelUse: 'JSColumnModel' },
};

export function createJsTemplateSurfaceMenuProvider(api: ApiClientLike): RunJSSurfaceMenuItemProvider {
  return async (context) => {
    const options = resolveSurfaceMenuOptions(context);
    if (!options) {
      return null;
    }
    const source = createJsTemplateModelMenuProvider(api, options);
    const items = Array.isArray(source) ? source : await source(context.ctx);
    return items[0] || null;
  };
}

export function createJsTemplateModelMenuProvider(
  api: ApiClientLike,
  options: JsTemplateModelMenuOptions,
): SubModelItemsType {
  return (ctx) => [
    {
      key: 'js-template',
      label: translate(ctx, 'JS Template'),
      sort: options.target === 'field' ? 111 : undefined,
      useModel: options.target === 'action' ? getModelUse(options) : undefined,
      searchable: true,
      children: async (childrenContext) => {
        try {
          return await buildProjectItems(api, options, childrenContext);
        } catch {
          return [
            {
              key: 'js-template-load-error',
              label: translate(childrenContext, 'Failed to load templates'),
              disabled: true,
            },
          ];
        }
      },
    },
  ];
}

async function buildProjectItems(
  api: ApiClientLike,
  options: JsTemplateModelMenuOptions,
  ctx: FlowModelContext,
): Promise<SubModelItem[]> {
  const kind = targetKinds[options.target];
  const templates = await listSelectableJsTemplates(api, { kind });
  const templatesByProject = templates
    .filter((template) => matchesTarget(template, options.target))
    .reduce((groups, template) => {
      const group = groups.get(template.projectId);
      if (group) {
        group.push(template);
      } else {
        groups.set(template.projectId, [template]);
      }
      return groups;
    }, new Map<string, JsTemplateSelectableTemplateSummary[]>());

  return Array.from(templatesByProject, ([projectId, projectTemplates]) => {
    const projectLabel = getProjectLabel(projectTemplates[0]);
    return {
      key: `js-template-project:${projectId}`,
      label: projectLabel,
      children: projectTemplates.map((template) => createTemplateMenuItem(template, options, ctx)),
    } satisfies SubModelItem;
  });
}

function matchesTarget(template: JsTemplateSelectableTemplateSummary, target: JsTemplateModelMenuTarget): boolean {
  if (template.kind !== targetKinds[target] || template.runtimeAvailable !== true) {
    return false;
  }
  if (target === 'field') {
    return template.category !== 'js-column';
  }
  if (target === 'column') {
    return template.category === 'js-column';
  }
  return true;
}

function createTemplateMenuItem(
  template: JsTemplateSelectableTemplateSummary,
  options: JsTemplateModelMenuOptions,
  ctx: FlowModelContext,
): SubModelItem {
  const runJs = createRunJs(template);
  if (options.target === 'field') {
    return {
      key: `js-template-template:${template.id}`,
      label: getTemplateLabel(template),
      searchable: true,
      searchPlaceholder: translate(ctx, 'Search fields'),
      children: (ctx) =>
        createBoundFieldItems(ctx, {
          itemModelUse: options.itemModelUse,
          fieldModelUse: options.fieldModelUse,
          refreshTargets: options.refreshTargets,
          runJs,
        }),
    };
  }

  const modelUse = getModelUse(options);
  return {
    key: `js-template-template:${template.id}`,
    label: getTemplateLabel(template),
    useModel: modelUse,
    createModelOptions: createTemplateModelOptions(template, runJs, options, modelUse),
  };
}

function createRunJs(template: JsTemplateSelectableTemplateSummary) {
  const persisted = serializeJsTemplateRunJSPersistence(createRuntimeSourceBinding(template));
  return {
    version: 'v2',
    ...persisted,
    settings: extractRunJSSettingsDefaults(template.settingsSchema),
  };
}

function createBoundFieldItems(
  ctx: FlowModelContext,
  options: {
    itemModelUse: string;
    fieldModelUse: string;
    refreshTargets: string[];
    runJs: ReturnType<typeof createRunJs>;
  },
): SubModelItem[] {
  const groups = buildWrapperFieldChildren(ctx, {
    useModel: options.itemModelUse,
    fieldUseModel: options.fieldModelUse,
    refreshTargets: options.refreshTargets,
  });
  const children = groups[0]?.children;
  return bindRunJsToFieldItems(Array.isArray(children) ? children : [], options.runJs);
}

function bindRunJsToFieldItems(items: SubModelItem[], runJs: ReturnType<typeof createRunJs>): SubModelItem[] {
  return items.map((item) => {
    const next: SubModelItem = { ...item };
    if (Array.isArray(next.children)) {
      next.children = bindRunJsToFieldItems(next.children, runJs);
    } else if (typeof next.children === 'function') {
      const resolveChildren = next.children;
      next.children = async (ctx) => bindRunJsToFieldItems(await resolveChildren(ctx), runJs);
    }
    if (next.createModelOptions) {
      const resolveOptions = next.createModelOptions;
      next.createModelOptions = async (ctx) => {
        const resolved = (
          typeof resolveOptions === 'function' ? await resolveOptions(ctx) : resolveOptions
        ) as CreateModelOptions;
        const field = resolved.subModels?.field;
        if (!isCreateModelOptions(field)) {
          return resolved;
        }
        const fieldStepParams = field.stepParams || {};
        return {
          ...resolved,
          subModels: {
            ...resolved.subModels,
            field: {
              ...field,
              stepParams: {
                ...fieldStepParams,
                jsSettings: {
                  ...fieldStepParams.jsSettings,
                  runJs,
                },
              },
            },
          },
        };
      };
    }
    return next;
  });
}

function createTemplateModelOptions(
  template: JsTemplateSelectableTemplateSummary,
  runJs: ReturnType<typeof createRunJs>,
  options: JsTemplateModelMenuOptions,
  modelUse: string,
) {
  if (options.target === 'action') {
    return {
      use: modelUse,
      stepParams: { clickSettings: { runJs } },
    };
  }
  if (options.target === 'column') {
    return {
      use: modelUse,
      stepParams: {
        tableColumnSettings: { title: { title: getTemplateLabel(template) } },
        jsSettings: { runJs },
      },
    };
  }
  return {
    use: modelUse,
    stepParams: { jsSettings: { runJs } },
  };
}

function getModelUse(options: JsTemplateModelMenuOptions): string {
  if (options.target === 'field') {
    throw new Error('modelUse is not available for JS Template field menus');
  }
  const modelUse = options.modelUse || defaultModelUses[options.target];
  if (!modelUse) {
    throw new Error(`modelUse is required for JS Template ${options.target} menus`);
  }
  return modelUse;
}

function createRuntimeSourceBinding(template: JsTemplateSelectableTemplateSummary): JsTemplateRuntimeSourceBinding {
  return createJsTemplateRuntimeSourceBinding({
    projectId: template.projectId,
    templateId: template.id,
    kind: template.kind,
  });
}

function getProjectLabel(template?: JsTemplateSelectableTemplateSummary): string {
  return template?.projectTitle?.trim() || template?.projectName?.trim() || template?.projectId || '';
}

function getTemplateLabel(template: JsTemplateSelectableTemplateSummary): string {
  return template.templateName || template.id;
}

function resolveSurfaceMenuOptions(context: RunJSSurfaceMenuItemProviderContext): JsTemplateModelMenuOptions | null {
  if (context.surface === 'block') {
    return { target: 'block' };
  }
  if (context.surface === 'action') {
    const modelUse = ACTION_MODEL_USES.find((candidate) => containsModelUse(context.items, candidate));
    return modelUse ? { target: 'action', modelUse } : null;
  }
  return FIELD_SURFACE_OPTIONS[context.surface] || null;
}

function containsModelUse(items: SubModelItem[], expected: string): boolean {
  return items.some((item) => {
    if (item.useModel === expected) {
      return true;
    }
    return Array.isArray(item.children) ? containsModelUse(item.children, expected) : false;
  });
}

function translate(ctx: FlowModelContext, key: string): string {
  return ctx.t(key, { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
}

function isCreateModelOptions(value: unknown): value is CreateModelOptions {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && 'use' in value;
}
