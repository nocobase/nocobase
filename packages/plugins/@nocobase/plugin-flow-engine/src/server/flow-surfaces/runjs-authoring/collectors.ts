/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import type { FlowSurfaceErrorItemInput } from '../errors';
import { getChartBuilderResourceInit } from '../chart-config';
import type {
  FlowSurfaceAuthoringWriteAction,
  PlainRecord,
  RunJsAuthoringContext,
  RunJsCodeSource,
  RunJsSourceBudget,
} from './internal-types';
import { dedupeErrors } from './runtime/errors';
import { createRunJsSourceBudget } from './runtime/source-budget';
import {
  normalizeActionType,
  normalizeText,
  resolveActionModelUse,
  resolveConfigureBlockType,
  resolveConfigureModelUse,
  resolveFieldModelUse,
  resolveModelSurfaceStyle,
  resolvePublicBlockType,
} from './runtime/surface';
import { inspectRunJsAuthoringCodeForWrite } from './inspect';

const HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE: Record<string, string[]> = {
  calendar: ['quickCreatePopup', 'eventPopup'],
  kanban: ['quickCreatePopup', 'cardPopup'],
};

function asPlainRecord(value: unknown): PlainRecord | undefined {
  return _.isPlainObject(value) ? (value as PlainRecord) : undefined;
}

export function collectRunJsAuthoringErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  const validationContext = {
    ...context,
    authoringActionName: actionName,
    runJsSourceBudget: createRunJsSourceBudget(),
  };
  if (!_.isPlainObject(values)) {
    return errors;
  }

  if (actionName === 'configure') {
    collectConfigureRunJsErrors(values, validationContext, errors);
    collectReactionRunJsErrors(
      values.reaction,
      '$.reaction',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
    collectReactionRunJsErrors(
      values.changes?.reaction,
      '$.changes.reaction',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
    return dedupeErrors(errors);
  }

  if (actionName === 'applyBlueprint') {
    collectChartAssetRunJsErrors(
      values.assets?.charts,
      '$.assets.charts',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
  }

  getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
    collectBlockRunJsErrors(block, path, validationContext, errors),
  );
  collectReactionRunJsErrors(
    values.reaction,
    '$.reaction',
    errors,
    validationContext.runJsSourceBudget,
    validationContext,
  );
  return dedupeErrors(errors);
}

export function collectFlowRegistryRunJsAuthoringErrors(
  flowRegistry: any,
  path = '$.flowRegistry',
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  collectFlowRegistryRunJsErrors(flowRegistry, path, errors, createRunJsSourceBudget(), context);
  return dedupeErrors(errors);
}

function collectConfigureRunJsErrors(values: any, context: RunJsAuthoringContext, errors: FlowSurfaceErrorItemInput[]) {
  const changes = values.changes;
  if (!_.isPlainObject(changes)) {
    return;
  }
  const modelUse = resolveConfigureModelUse(context.currentNode);
  const surfaceStyle = resolveModelSurfaceStyle(modelUse);
  const hostBlockType = resolveConfigureBlockType(context);
  if (typeof changes.code === 'string' && changes.code.trim()) {
    errors.push(
      ...inspectRunJsAuthoringCodeForWrite(
        {
          code: changes.code,
          path: '$.changes.code',
          modelUse: modelUse || 'unknown',
          surfaceStyle,
        },
        context.runJsSourceBudget,
        context,
      ),
    );
  }
  if (hostBlockType === 'chart') {
    collectChartRawRunJsErrors(changes, '$.changes', errors, context.runJsSourceBudget, context);
    collectChartLegacyConfigureRunJsErrors(
      changes.configure,
      '$.changes.configure',
      errors,
      context.runJsSourceBudget,
      context,
    );
  }

  const recursiveChanges = {
    ...changes,
    type: hostBlockType,
  };
  delete recursiveChanges.code;
  delete recursiveChanges.source;
  if (_.isPlainObject(recursiveChanges.settings)) {
    recursiveChanges.settings = _.omit(recursiveChanges.settings, ['code', 'source']);
  }
  collectBlockRunJsErrors(recursiveChanges, '$.changes', context, errors);
  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[hostBlockType]?.forEach((key) => {
    collectBlockListRunJsErrors(changes?.[key]?.blocks, `$.changes.${key}.blocks`, context, errors);
    collectReactionRunJsErrors(
      changes?.[key]?.reaction,
      `$.changes.${key}.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function createRunJsResourceContext(context: RunJsAuthoringContext, resourceInit: any): RunJsAuthoringContext {
  const collectionName = normalizeText(resourceInit?.collectionName);
  if (!collectionName) {
    return context;
  }
  const dataSourceKey =
    normalizeText(resourceInit?.dataSourceKey) ||
    normalizeText(context.currentDataSourceKey || context.hostDataSourceKey) ||
    'main';
  return {
    ...context,
    currentDataSourceKey: dataSourceKey,
    currentCollectionName: collectionName,
  };
}

function getRunJsBlockResourceInit(block: any, blockType: string) {
  const resourceInit = asPlainRecord(block?.resourceInit);
  const resource = asPlainRecord(block?.resource);
  const chartResourceInit =
    blockType === 'chart'
      ? getChartBuilderResourceInit(block?.settings?.configure || block?.configure || block?.chartSettings?.configure)
      : null;
  return {
    dataSourceKey:
      block?.dataSourceKey ||
      resource?.dataSourceKey ||
      resourceInit?.dataSourceKey ||
      chartResourceInit?.dataSourceKey,
    collectionName:
      block?.collection ||
      resource?.collectionName ||
      resourceInit?.collectionName ||
      chartResourceInit?.collectionName,
  };
}

function getAuthoringBlocks(actionName: FlowSurfaceAuthoringWriteAction, values: any) {
  if (actionName === 'addBlock') {
    return [{ block: values, path: '$' }];
  }
  if (actionName === 'addBlocks' || actionName === 'compose') {
    return _.castArray(values.blocks || []).map((block, index) => ({
      block,
      path: `$.blocks[${index}]`,
    }));
  }
  if (actionName === 'applyBlueprint') {
    return _.castArray(values.tabs || []).flatMap((tab, tabIndex) =>
      _.castArray(tab?.blocks || []).map((block, blockIndex) => ({
        block,
        path: `$.tabs[${tabIndex}].blocks[${blockIndex}]`,
      })),
    );
  }
  return [];
}

function collectBlockRunJsErrors(
  block: any,
  path: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!_.isPlainObject(block)) {
    return;
  }
  const blockType = resolvePublicBlockType(block.type || block.use);
  const blockContext = createRunJsResourceContext(context, getRunJsBlockResourceInit(block, blockType));

  if (blockType === 'jsBlock') {
    collectRunJsSources(block, path, blockContext).forEach((source) => {
      errors.push(
        ...inspectRunJsAuthoringCodeForWrite(
          {
            code: source.code,
            path: source.path,
            modelUse: 'JSBlockModel',
            surfaceStyle: 'render',
          },
          blockContext.runJsSourceBudget,
          blockContext,
        ),
      );
    });
  }
  if (blockType === 'chart') {
    collectChartRawRunJsErrors(
      block.settings,
      `${path}.settings`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
    collectChartLegacyConfigureRunJsErrors(
      block.settings?.configure,
      `${path}.settings.configure`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
  }

  collectFieldListRunJsErrors(block.fields, `${path}.fields`, blockType, blockContext, errors);
  _.castArray(block.fieldGroups || []).forEach((group, groupIndex) => {
    collectFieldListRunJsErrors(
      group?.fields,
      `${path}.fieldGroups[${groupIndex}].fields`,
      blockType,
      blockContext,
      errors,
    );
  });
  collectActionListRunJsErrors(block.actions, `${path}.actions`, blockType, 'actions', blockContext, errors);
  collectActionListRunJsErrors(
    block.recordActions,
    `${path}.recordActions`,
    blockType,
    'recordActions',
    blockContext,
    errors,
  );
  collectReactionRunJsErrors(block.reaction, `${path}.reaction`, errors, blockContext.runJsSourceBudget, blockContext);
  collectFlowRegistryRunJsErrors(
    block.flowRegistry,
    `${path}.flowRegistry`,
    errors,
    blockContext.runJsSourceBudget,
    blockContext,
  );
  collectBlockListRunJsErrors(block.blocks, `${path}.blocks`, blockContext, errors);
  collectBlockListRunJsErrors(block.popup?.blocks, `${path}.popup.blocks`, blockContext, errors);
  collectReactionRunJsErrors(
    block.popup?.reaction,
    `${path}.popup.reaction`,
    errors,
    blockContext.runJsSourceBudget,
    blockContext,
  );

  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[blockType]?.forEach((key) => {
    collectBlockListRunJsErrors(block.settings?.[key]?.blocks, `${path}.settings.${key}.blocks`, blockContext, errors);
    collectReactionRunJsErrors(
      block.settings?.[key]?.reaction,
      `${path}.settings.${key}.reaction`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
  });
}

function collectBlockListRunJsErrors(
  blocks: any,
  path: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(blocks)) {
    return;
  }
  blocks.forEach((block, index) => collectBlockRunJsErrors(block, `${path}[${index}]`, context, errors));
}

function collectFieldListRunJsErrors(
  fields: any,
  path: string,
  blockType: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(fields)) {
    return;
  }
  fields.forEach((field, index) => {
    const fieldPath = `${path}[${index}]`;
    if (!_.isPlainObject(field)) {
      return;
    }
    const type = normalizeText(field.type);
    const renderer = normalizeText(field.renderer);
    const modelUse = resolveFieldModelUse(type, renderer, blockType);
    if (modelUse) {
      collectRunJsSources(field, fieldPath, context).forEach((source) => {
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code: source.code,
              path: source.path,
              modelUse,
              surfaceStyle: 'render',
            },
            context.runJsSourceBudget,
            context,
          ),
        );
      });
    }
    collectReactionRunJsErrors(field.reaction, `${fieldPath}.reaction`, errors, context.runJsSourceBudget, context);
    collectActionListRunJsErrors(field.actions, `${fieldPath}.actions`, blockType, 'actions', context, errors);
    collectBlockListRunJsErrors(field.popup?.blocks, `${fieldPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(
      field.popup?.reaction,
      `${fieldPath}.popup.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function collectActionListRunJsErrors(
  actions: any,
  path: string,
  blockType: string,
  slot: 'actions' | 'recordActions',
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(actions)) {
    return;
  }
  actions.forEach((action, index) => {
    const actionPath = `${path}[${index}]`;
    if (!_.isPlainObject(action)) {
      return;
    }
    const actionType = normalizeActionType(action.type || action.key || action.action || action.use);
    const modelUse = resolveActionModelUse(actionType, blockType, slot);
    if (modelUse) {
      collectRunJsSources(action, actionPath, context).forEach((source) => {
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code: source.code,
              path: source.path,
              modelUse,
              surfaceStyle: resolveModelSurfaceStyle(modelUse),
            },
            context.runJsSourceBudget,
            context,
          ),
        );
      });
    }
    collectReactionRunJsErrors(action.reaction, `${actionPath}.reaction`, errors, context.runJsSourceBudget, context);
    collectBlockListRunJsErrors(action.popup?.blocks, `${actionPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.popup?.reaction,
      `${actionPath}.popup.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
    collectBlockListRunJsErrors(action.openView?.blocks, `${actionPath}.openView.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.openView?.reaction,
      `${actionPath}.openView.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function collectChartAssetRunJsErrors(
  charts: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(charts)) {
    return;
  }
  Object.entries(charts).forEach(([key, asset]) => {
    if (!_.isPlainObject(asset)) {
      return;
    }
    collectChartRawRunJsErrors(
      asset,
      `${path}.${key}`,
      errors,
      budget,
      createRunJsResourceContext(context, getChartBuilderResourceInit(asset)),
    );
  });
}

function collectChartLegacyConfigureRunJsErrors(
  configure: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(configure)) {
    return;
  }
  const chartContext = createRunJsResourceContext(context, getChartBuilderResourceInit(configure));
  const chart = _.isPlainObject(configure.chart) ? configure.chart : undefined;
  const option = _.isPlainObject(chart?.option) ? chart.option : undefined;
  const events = _.isPlainObject(chart?.events) ? chart.events : undefined;
  collectChartOptionRunJsErrors(option?.raw, `${path}.chart.option.raw`, errors, budget, chartContext);
  collectChartEventsRunJsErrors(events?.raw, `${path}.chart.events.raw`, errors, budget, chartContext);
}

function collectChartRawRunJsErrors(
  value: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const chartContext = createRunJsResourceContext(context, getChartBuilderResourceInit(value));
  const visual = _.isPlainObject(value.visual) ? value.visual : undefined;
  const events = _.isPlainObject(value.events) ? value.events : undefined;
  collectChartOptionRunJsErrors(visual?.raw, `${path}.visual.raw`, errors, budget, chartContext);
  collectChartEventsRunJsErrors(events?.raw, `${path}.events.raw`, errors, budget, chartContext);
}

function collectChartOptionRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCodeForWrite(
      {
        code,
        path,
        modelUse: 'ChartOptionModel',
        surfaceStyle: 'value',
      },
      budget,
      context,
    ),
  );
}

function collectChartEventsRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCodeForWrite(
      {
        code,
        path,
        modelUse: 'ChartEventsModel',
        surfaceStyle: 'action',
      },
      budget,
      context,
    ),
  );
}

function collectReactionRunJsErrors(
  reaction: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!reaction || (!_.isPlainObject(reaction) && !Array.isArray(reaction))) {
    return;
  }
  const visit = (value: any, valuePath: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${valuePath}[${index}]`));
      return;
    }
    if (!_.isPlainObject(value)) {
      return;
    }
    if (value.source === 'runjs' && typeof value.code === 'string' && value.code.trim()) {
      errors.push(
        ...inspectRunJsAuthoringCodeForWrite(
          {
            code: value.code,
            path: `${valuePath}.code`,
            surface: 'reaction.value-runjs',
            surfaceStyle: 'value',
          },
          budget,
          context,
        ),
      );
    }
    const actionType = normalizeText(value.type || value.name);
    if (actionType === 'runjs' || /runjs/i.test(actionType)) {
      const code =
        typeof value.code === 'string'
          ? value.code
          : typeof value.params?.value?.script === 'string'
            ? value.params.value.script
            : typeof value.params?.code === 'string'
              ? value.params.code
              : '';
      if (code.trim()) {
        const codePath =
          typeof value.code === 'string'
            ? `${valuePath}.code`
            : typeof value.params?.value?.script === 'string'
              ? `${valuePath}.params.value.script`
              : `${valuePath}.params.code`;
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code,
              path: codePath,
              surface: 'linkage.execute-javascript',
              surfaceStyle: 'action',
            },
            budget,
            context,
          ),
        );
      }
    }
    Object.entries(value).forEach(([key, child]) => {
      if (key === 'code' || key === 'params') {
        return;
      }
      visit(child, `${valuePath}.${key}`);
    });
  };
  visit(reaction, path);
}

function collectFlowRegistryRunJsErrors(
  flowRegistry: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  const registry = asPlainRecord(flowRegistry);
  if (!registry) {
    return;
  }
  Object.entries(registry).forEach(([flowKey, flowValue]) => {
    const flow = asPlainRecord(flowValue);
    if (!flow) {
      return;
    }
    const steps = asPlainRecord(flow.steps) || {};
    Object.entries(steps).forEach(([stepKey, stepValue]) => {
      const step = asPlainRecord(stepValue);
      if (!step || normalizeText(step.use || step.type || step.action || step.key) !== 'runjs') {
        return;
      }
      collectEventFlowRunJsStepErrors(step, `${path}.${flowKey}.steps.${stepKey}`, errors, budget, context);
    });
  });
}

function collectEventFlowRunJsStepErrors(
  step: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  const addSource = (code: any, sourcePath: string) => {
    if (typeof code !== 'string' || !code.trim()) {
      return;
    }
    errors.push(
      ...inspectRunJsAuthoringCodeForWrite(
        {
          code,
          path: sourcePath,
          surface: 'event-flow.execute-javascript',
          modelUse: 'JSActionModel',
          surfaceStyle: 'action',
        },
        budget,
        context,
      ),
    );
  };

  addSource(step.defaultParams?.code, `${path}.defaultParams.code`);
  addSource(step.params?.code, `${path}.params.code`);
  addSource(step.defaultParams?.value?.script, `${path}.defaultParams.value.script`);
  addSource(step.params?.value?.script, `${path}.params.value.script`);
}

function collectRunJsSources(spec: any, path: string, context: RunJsAuthoringContext): RunJsCodeSource[] {
  const sources: RunJsCodeSource[] = [];
  const settings = _.isPlainObject(spec.settings) ? spec.settings : undefined;
  const addSource = (code: any, sourcePath: string) => {
    if (typeof code === 'string' && code.trim()) {
      sources.push({ code, path: sourcePath });
    }
  };

  addSource(settings?.code, `${path}.settings.code`);
  addSource(settings?.source, `${path}.settings.source`);
  addSource(spec.code, `${path}.code`);
  addSource(spec.source, `${path}.source`);

  if (context.authoringActionName === 'applyBlueprint' && typeof spec.script === 'string' && spec.script.trim()) {
    const scriptKey = spec.script.trim();
    const asset = _.isPlainObject(context.applyBlueprintScriptAssets)
      ? context.applyBlueprintScriptAssets[scriptKey]
      : undefined;
    if (_.isPlainObject(asset) && typeof asset.code === 'string' && asset.code.trim()) {
      sources.push({
        code: asset.code,
        path: `${path}.script`,
      });
    }
  }

  return sources;
}
