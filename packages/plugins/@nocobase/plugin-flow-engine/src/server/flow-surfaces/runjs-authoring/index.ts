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
import { getRunJsAuthoringRule } from './rules';
import type { RunJsAuthoringInspectionInput, RunJsAuthoringRepairClass, RunJsAuthoringSurfaceStyle } from './types';

type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

type RunJsAuthoringContext = {
  authoringActionName?: FlowSurfaceAuthoringWriteAction;
  applyBlueprintScriptAssets?: Record<string, any>;
  currentNode?: any;
  hostBlockType?: string;
};

type RunJsCodeSource = {
  code: string;
  path: string;
};

type PlainRecord = Record<string, any>;

type SourceRange = {
  start: number;
  end: number;
};

type SourceBinding = SourceRange & {
  name: string;
};

type StringLiteralBinding = SourceBinding & {
  value: string;
};

type ReactComponentAlias = SourceRange & {
  capability: string;
  name: string;
};

type FlowResourceAlias = SourceRange & {
  capability: string;
  name: string;
};

type CallArgumentSource = SourceRange & {
  source: string;
};

const HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE: Record<string, string[]> = {
  calendar: ['quickCreatePopup', 'eventPopup'],
  kanban: ['quickCreatePopup', 'cardPopup'],
};

const RENDER_MODEL_USES = new Set([
  'JSBlockModel',
  'JSColumnModel',
  'JSFieldModel',
  'JSItemModel',
  'JSEditableFieldModel',
  'FormJSFieldItemModel',
  'JSItemActionModel',
]);

const ACTION_MODEL_USES = new Set([
  'JSActionModel',
  'JSFormActionModel',
  'JSRecordActionModel',
  'JSCollectionActionModel',
  'FilterFormJSActionModel',
  'ChartEventsModel',
]);

const VALUE_MODEL_USES = new Set(['ChartOptionModel']);

const KNOWN_MODEL_USES = new Set([...RENDER_MODEL_USES, ...ACTION_MODEL_USES, ...VALUE_MODEL_USES]);

const PUBLIC_BLOCK_TYPE_BY_MODEL_USE: Record<string, string> = {
  TableBlockModel: 'table',
  CalendarBlockModel: 'calendar',
  TreeBlockModel: 'tree',
  KanbanBlockModel: 'kanban',
  FormBlockModel: 'editForm',
  CreateFormModel: 'createForm',
  EditFormModel: 'editForm',
  DetailsBlockModel: 'details',
  FilterFormBlockModel: 'filterForm',
  ListBlockModel: 'list',
  GridCardBlockModel: 'gridCard',
  ChartBlockModel: 'chart',
  MapBlockModel: 'map',
  CommentsBlockModel: 'comments',
  JSBlockModel: 'jsBlock',
  MarkdownBlockModel: 'markdown',
  IframeBlockModel: 'iframe',
  ActionPanelBlockModel: 'actionPanel',
};

const SURFACE_STYLE_BY_ID: Record<string, RunJsAuthoringSurfaceStyle> = {
  'event-flow.execute-javascript': 'action',
  'linkage.execute-javascript': 'action',
  'reaction.value-runjs': 'value',
  'custom-variable.runjs': 'value',
  'js-model.render': 'render',
  'js-model.action': 'action',
};

const SURFACE_ALLOWED_MODEL_USES: Record<string, Set<string>> = {
  'event-flow.execute-javascript': new Set(['JSActionModel']),
  'linkage.execute-javascript': new Set([
    'JSEditableFieldModel',
    'JSItemModel',
    'JSRecordActionModel',
    'JSCollectionActionModel',
    'JSItemActionModel',
    'FormJSFieldItemModel',
  ]),
  'reaction.value-runjs': new Set(['JSEditableFieldModel', 'JSItemModel', 'FormJSFieldItemModel']),
  'custom-variable.runjs': new Set(['JSEditableFieldModel', 'JSItemModel', 'FormJSFieldItemModel']),
  'js-model.render': RENDER_MODEL_USES,
  'js-model.action': ACTION_MODEL_USES,
};

const ALLOWED_CTX_ROOTS = new Set([
  'acl',
  'antd',
  'antdIcons',
  'api',
  'auth',
  'collection',
  'console',
  'dataSourceManager',
  'date',
  'dayjs',
  'element',
  'engine',
  'form',
  'formValues',
  'getValue',
  'getVar',
  'importAsync',
  'initResource',
  'libs',
  'logger',
  'makeResource',
  'message',
  'modal',
  'model',
  'notification',
  'popup',
  'React',
  'ReactDOM',
  'record',
  'render',
  'request',
  'requireAsync',
  'resource',
  'role',
  'runAction',
  'runjs',
  'setValue',
  't',
  'user',
  'value',
  'viewer',
]);

const CHART_CTX_ROOTS = new Set(['data']);

const BLOCKED_CTX_CAPABILITIES: Record<string, { capability: string; reroute: string }> = {
  openView: {
    capability: 'ctx.openView',
    reroute: 'popup-action-or-field-popup',
  },
};

const FORBIDDEN_BARE_GLOBALS = new Set([
  'fetch',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'BroadcastChannel',
  'EventSource',
  'indexedDB',
  'caches',
  'Function',
  'eval',
  'globalThis',
  'process',
  'require',
  'module',
  'exports',
  'location',
]);

const NON_METHOD_CALL_KEYWORDS = new Set(['catch', 'do', 'for', 'function', 'if', 'switch', 'while', 'with']);

const ACTION_TYPE_ALIASES = new Map([
  ['jsitem', 'jsItem'],
  ['js-item', 'jsItem'],
]);

const REACT_HOOK_NAMES = [
  'useActionState',
  'useCallback',
  'useContext',
  'useDebugValue',
  'useDeferredValue',
  'useEffect',
  'useId',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
  'useOptimistic',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
];

const REACT_HOOK_PATTERN = REACT_HOOK_NAMES.map(escapeRegExp).join('|');
const RUNJS_RESOURCE_ACTION_PATTERN = '(?:list|get|create|update|destroy)';
const FLOW_RESOURCE_CLASS_NAMES = new Set([
  'FlowResource',
  'APIResource',
  'SingleRecordResource',
  'MultiRecordResource',
  'SQLResource',
]);
const REACT_NODE_COMPONENT_PROP_NAMES = new Set(['avatar', 'extra', 'icon', 'prefix', 'suffix']);

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
  };
  if (!_.isPlainObject(values)) {
    return errors;
  }

  if (actionName === 'configure') {
    collectConfigureRunJsErrors(values, validationContext, errors);
    collectReactionRunJsErrors(values.reaction, '$.reaction', errors);
    collectReactionRunJsErrors(values.changes?.reaction, '$.changes.reaction', errors);
    return dedupeErrors(errors);
  }

  if (actionName === 'applyBlueprint') {
    collectChartAssetRunJsErrors(values.assets?.charts, '$.assets.charts', errors);
  }

  getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
    collectBlockRunJsErrors(block, path, validationContext, errors),
  );
  collectReactionRunJsErrors(values.reaction, '$.reaction', errors);
  return dedupeErrors(errors);
}

export function collectFlowRegistryRunJsAuthoringErrors(
  flowRegistry: any,
  path = '$.flowRegistry',
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  collectFlowRegistryRunJsErrors(flowRegistry, path, errors);
  return dedupeErrors(errors);
}

export function inspectRunJsAuthoringCode(input: RunJsAuthoringInspectionInput): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  const source = String(input.code || '');
  const modelUse = normalizeText(input.modelUse);
  const surface = normalizeText(input.surface);
  const surfaceStyle = resolveSurfaceStyle(input);

  if (surface && !SURFACE_STYLE_BY_ID[surface]) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} references unknown RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (modelUse && !KNOWN_MODEL_USES.has(modelUse)) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} references unknown JS model '${modelUse}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (
    surface &&
    modelUse &&
    SURFACE_ALLOWED_MODEL_USES[surface] &&
    !SURFACE_ALLOWED_MODEL_USES[surface].has(modelUse)
  ) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} model '${modelUse}' is not supported by RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (!surfaceStyle) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: modelUse ? 'unknown-model-stop' : 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} cannot resolve a RunJS validation surface`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  const scan = scanJavaScriptSource(source);
  collectResourceApiErrors(input.path, source, scan, modelUse, surface, errors);
  collectResourceRuntimeErrors(input.path, source, scan, modelUse, surface, errors);
  collectDirectDomErrors(input.path, source, scan, modelUse, surface, errors);
  collectGlobalErrors(input.path, source, scan, modelUse, surface, errors);
  collectReactRuntimeErrors(input.path, source, scan, modelUse, surface, errors);
  collectCtxContractErrors(input.path, source, scan, modelUse, surface, errors);
  collectSurfaceStyleErrors(input.path, source, scan, surfaceStyle, modelUse, surface, errors);
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
      ...inspectRunJsAuthoringCode({
        code: changes.code,
        path: '$.changes.code',
        modelUse: modelUse || 'unknown',
        surfaceStyle,
      }),
    );
  }
  if (hostBlockType === 'chart') {
    collectChartRawRunJsErrors(changes, '$.changes', errors);
    collectChartLegacyConfigureRunJsErrors(changes.configure, '$.changes.configure', errors);
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
    collectReactionRunJsErrors(changes?.[key]?.reaction, `$.changes.${key}.reaction`, errors);
  });
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

  if (blockType === 'jsBlock') {
    collectRunJsSources(block, path, context).forEach((source) => {
      errors.push(
        ...inspectRunJsAuthoringCode({
          code: source.code,
          path: source.path,
          modelUse: 'JSBlockModel',
          surfaceStyle: 'render',
        }),
      );
    });
  }
  if (blockType === 'chart') {
    collectChartRawRunJsErrors(block.settings, `${path}.settings`, errors);
    collectChartLegacyConfigureRunJsErrors(block.settings?.configure, `${path}.settings.configure`, errors);
  }

  collectFieldListRunJsErrors(block.fields, `${path}.fields`, blockType, context, errors);
  _.castArray(block.fieldGroups || []).forEach((group, groupIndex) => {
    collectFieldListRunJsErrors(group?.fields, `${path}.fieldGroups[${groupIndex}].fields`, blockType, context, errors);
  });
  collectActionListRunJsErrors(block.actions, `${path}.actions`, blockType, 'actions', context, errors);
  collectActionListRunJsErrors(
    block.recordActions,
    `${path}.recordActions`,
    blockType,
    'recordActions',
    context,
    errors,
  );
  collectReactionRunJsErrors(block.reaction, `${path}.reaction`, errors);
  collectFlowRegistryRunJsErrors(block.flowRegistry, `${path}.flowRegistry`, errors);
  collectBlockListRunJsErrors(block.blocks, `${path}.blocks`, context, errors);
  collectBlockListRunJsErrors(block.popup?.blocks, `${path}.popup.blocks`, context, errors);
  collectReactionRunJsErrors(block.popup?.reaction, `${path}.popup.reaction`, errors);

  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[blockType]?.forEach((key) => {
    collectBlockListRunJsErrors(block.settings?.[key]?.blocks, `${path}.settings.${key}.blocks`, context, errors);
    collectReactionRunJsErrors(block.settings?.[key]?.reaction, `${path}.settings.${key}.reaction`, errors);
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
          ...inspectRunJsAuthoringCode({
            code: source.code,
            path: source.path,
            modelUse,
            surfaceStyle: 'render',
          }),
        );
      });
    }
    collectReactionRunJsErrors(field.reaction, `${fieldPath}.reaction`, errors);
    collectActionListRunJsErrors(field.actions, `${fieldPath}.actions`, blockType, 'actions', context, errors);
    collectBlockListRunJsErrors(field.popup?.blocks, `${fieldPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(field.popup?.reaction, `${fieldPath}.popup.reaction`, errors);
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
          ...inspectRunJsAuthoringCode({
            code: source.code,
            path: source.path,
            modelUse,
            surfaceStyle: resolveModelSurfaceStyle(modelUse),
          }),
        );
      });
    }
    collectReactionRunJsErrors(action.reaction, `${actionPath}.reaction`, errors);
    collectBlockListRunJsErrors(action.popup?.blocks, `${actionPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(action.popup?.reaction, `${actionPath}.popup.reaction`, errors);
    collectBlockListRunJsErrors(action.openView?.blocks, `${actionPath}.openView.blocks`, context, errors);
    collectReactionRunJsErrors(action.openView?.reaction, `${actionPath}.openView.reaction`, errors);
  });
}

function collectChartAssetRunJsErrors(charts: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  if (!_.isPlainObject(charts)) {
    return;
  }
  Object.entries(charts).forEach(([key, asset]) => {
    if (!_.isPlainObject(asset)) {
      return;
    }
    collectChartRawRunJsErrors(asset, `${path}.${key}`, errors);
  });
}

function collectChartLegacyConfigureRunJsErrors(configure: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  if (!_.isPlainObject(configure)) {
    return;
  }
  const chart = _.isPlainObject(configure.chart) ? configure.chart : undefined;
  const option = _.isPlainObject(chart?.option) ? chart.option : undefined;
  const events = _.isPlainObject(chart?.events) ? chart.events : undefined;
  collectChartOptionRunJsErrors(option?.raw, `${path}.chart.option.raw`, errors);
  collectChartEventsRunJsErrors(events?.raw, `${path}.chart.events.raw`, errors);
}

function collectChartRawRunJsErrors(value: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const visual = _.isPlainObject(value.visual) ? value.visual : undefined;
  const events = _.isPlainObject(value.events) ? value.events : undefined;
  collectChartOptionRunJsErrors(visual?.raw, `${path}.visual.raw`, errors);
  collectChartEventsRunJsErrors(events?.raw, `${path}.events.raw`, errors);
}

function collectChartOptionRunJsErrors(code: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCode({
      code,
      path,
      modelUse: 'ChartOptionModel',
      surfaceStyle: 'value',
    }),
  );
}

function collectChartEventsRunJsErrors(code: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCode({
      code,
      path,
      modelUse: 'ChartEventsModel',
      surfaceStyle: 'action',
    }),
  );
}

function collectReactionRunJsErrors(reaction: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
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
        ...inspectRunJsAuthoringCode({
          code: value.code,
          path: `${valuePath}.code`,
          surface: 'reaction.value-runjs',
          surfaceStyle: 'value',
        }),
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
          ...inspectRunJsAuthoringCode({
            code,
            path: codePath,
            surface: 'linkage.execute-javascript',
            surfaceStyle: 'action',
          }),
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

function collectFlowRegistryRunJsErrors(flowRegistry: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
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
      collectEventFlowRunJsStepErrors(step, `${path}.${flowKey}.steps.${stepKey}`, errors);
    });
  });
}

function collectEventFlowRunJsStepErrors(step: any, path: string, errors: FlowSurfaceErrorItemInput[]) {
  const addSource = (code: any, sourcePath: string) => {
    if (typeof code !== 'string' || !code.trim()) {
      return;
    }
    errors.push(
      ...inspectRunJsAuthoringCode({
        code,
        path: sourcePath,
        surface: 'event-flow.execute-javascript',
        modelUse: 'JSActionModel',
        surfaceStyle: 'action',
      }),
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

function collectSurfaceStyleErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  surfaceStyle: RunJsAuthoringSurfaceStyle,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (surfaceStyle === 'value') {
    const render = scan.ctxRenderCalls[0];
    if (render) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'value-surface-forbids-render',
          message: `flowSurfaces authoring ${path} value RunJS must return a value and cannot call ctx.render(...)`,
          modelUse,
          surface,
          index: render.index,
          source,
        }),
      );
    }
    if (!scan.topLevelReturns.length) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'missing-top-level-return',
          message: `flowSurfaces authoring ${path} value RunJS must include a top-level return`,
          modelUse,
          surface,
          index: 0,
          source,
        }),
      );
    }
    return;
  }

  if (surfaceStyle !== 'render') {
    return;
  }

  const firstTopLevelRender = scan.topLevelCtxRenderCalls[0];
  const firstTopLevelReturn = scan.topLevelReturns[0];
  if (firstTopLevelRender && (!firstTopLevelReturn || firstTopLevelRender.index < firstTopLevelReturn.index)) {
    return;
  }
  if (firstTopLevelRender && firstTopLevelReturn && firstTopLevelReturn.index < firstTopLevelRender.index) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be reachable before any top-level return`,
        modelUse,
        surface,
        index: firstTopLevelRender.index,
        source,
      }),
    );
    return;
  }
  if (scan.directDomWrites[0]) {
    return;
  }
  if (scan.isTopLevelFunctionWrapper) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-top-level-function-wrapper',
        message: `flowSurfaces authoring ${path} render code cannot hide all render logic inside an uncalled top-level function`,
        modelUse,
        surface,
        index: scan.functionRanges[0]?.start || 0,
        source,
      }),
    );
    return;
  }
  if (scan.ctxRenderCalls.length) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be on the directly executed top-level path`,
        modelUse,
        surface,
        index: scan.ctxRenderCalls[0].index,
        source,
      }),
    );
    return;
  }
  errors.push(
    buildRunJsAuthoringError({
      path,
      repairClass: 'replace-innerhtml-with-render',
      ruleId: 'runjs-render-required',
      message: `flowSurfaces authoring ${path} render JS surfaces must call ctx.render(...) from reachable top-level code`,
      modelUse,
      surface,
      index: 0,
      source,
    }),
  );
}

function collectResourceApiErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.ctxRunjsCalls.forEach((entry) => {
    const endpoint = getResourceLikeCtxRunjsEntrypoint(source, scan.masked, entry.index);
    if (!endpoint) {
      return;
    }
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        message: `flowSurfaces authoring ${path} must use resource APIs for collection access; ctx.runjs(...) executes JavaScript strings, not resource endpoints`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'ctx.runjs',
          endpoint,
        },
      }),
    );
  });
  scan.ctxRequestCalls.forEach((entry) => {
    if (!isResourceLikeCtxRequest(source, scan.masked, entry.index)) {
      return;
    }
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        message: `flowSurfaces authoring ${path} must use resource APIs instead of ctx request APIs for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.invalidApiResourceCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        ruleId: 'runjs-api-resource-call-invalid',
        message: `flowSurfaces authoring ${path} cannot call ctx.api.resource.${entry.method}(...); use resource APIs or ctx.request(...) for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
          method: entry.method,
        },
      }),
    );
  });
}

function collectResourceRuntimeErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.invalidResourceTypeCalls.forEach((entry) => {
    const message =
      entry.ruleId === 'runjs-make-resource-type-invalid'
        ? `flowSurfaces authoring ${path} ${entry.capability}(...) expects a FlowResource class name, not collection '${entry.resourceType}'`
        : `flowSurfaces authoring ${path} cannot validate dynamic ${entry.capability}(...) resource type '${entry.expression}'`;
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: entry.ruleId,
        message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          expression: entry.expression,
          resourceType: entry.resourceType,
        },
      }),
    );
  });
  scan.invalidFlowResourceListCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-flow-resource-list-method-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}; FlowResource instances fetch through refresh() and expose getData()/getMeta()`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          method: 'list',
        },
      }),
    );
  });
}

function collectReactRuntimeErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.topLevelReactHookCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-hook-top-level-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React Hook ${entry.hook}(...) from top-level RunJS code`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          hook: entry.hook,
          capability: entry.match,
        },
      }),
    );
  });
  scan.unboundReactCreateElementCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-global-unbound',
        message: `flowSurfaces authoring ${path} cannot use bare React.createElement(...) without binding React from ctx.React`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'React.createElement',
        },
      }),
    );
  });
  scan.reactComponentFunctionCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-call-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React component ${entry.component} as a plain function`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.ctxRenderComponentSignatureCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-render-component-signature-invalid',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} directly to ctx.render(...)`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.reactComponentPropReferences.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-prop-node-required',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} as ${entry.prop}; create a React element first`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
          prop: entry.prop,
        },
      }),
    );
  });
}

function collectDirectDomErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.directDomAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} cannot alias ctx.element in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'ctx.element',
          alias: entry.alias,
        },
      }),
    );
  });
  scan.directDomWrites.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} must render through ctx.render(...) instead of direct DOM writes`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
        },
      }),
    );
  });
}

function collectGlobalErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.windowDocumentNavigatorAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        message: `flowSurfaces authoring ${path} cannot alias forbidden global ${entry.root}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.root,
          alias: entry.alias,
        },
      }),
    );
  });
  scan.windowDocumentNavigatorUses.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        ruleId: `runjs-${entry.root}-property-blocked`,
        message: `flowSurfaces authoring ${path} cannot access ${entry.root}.${entry.member} in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.root,
          member: entry.member,
        },
      }),
    );
  });
  scan.forbiddenBareGlobals.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        message: `flowSurfaces authoring ${path} cannot access forbidden global ${entry.name}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.name,
        },
      }),
    );
  });
}

function collectCtxContractErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.ctxAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-ctx-root-unknown',
        message: `flowSurfaces authoring ${path} cannot alias ctx in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          member: entry.alias,
        },
      }),
    );
  });
  scan.dynamicCtxAccesses.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-dynamic-ctx-member-unresolved',
        message: `flowSurfaces authoring ${path} cannot validate dynamic ctx[...] access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.ctxMemberAccesses.forEach((entry) => {
    const blocked = BLOCKED_CTX_CAPABILITIES[entry.member];
    if (blocked) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'blocked-capability-reroute',
          message: `flowSurfaces authoring ${path} ${blocked.capability} must be configured outside RunJS`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: blocked,
        }),
      );
      return;
    }
    if (!isAllowedCtxRoot(entry.member, modelUse)) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'ctx-root-mismatch-stop',
          message: `flowSurfaces authoring ${path} ctx.${entry.member} is not a supported RunJS ctx root`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            member: entry.member,
          },
        }),
      );
    }
  });
}

function isAllowedCtxRoot(member: string, modelUse: string) {
  return (
    ALLOWED_CTX_ROOTS.has(member) ||
    ((modelUse === 'ChartOptionModel' || modelUse === 'ChartEventsModel') && CHART_CTX_ROOTS.has(member))
  );
}

function scanJavaScriptSource(source: string) {
  const masked = maskJavaScriptSource(source);
  const functionRanges = findFunctionRanges(masked);
  const blockRanges = collectBraceRanges(masked);
  const sourceBindings = collectSourceBindings(masked, functionRanges, blockRanges);
  const stringLiteralBindings = collectStringLiteralBindings(source, masked, sourceBindings);
  const ctxRenderCalls = findMatches(masked, /\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g);
  const topLevelCtxRenderCalls = ctxRenderCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges));
  const topLevelReturns = findMatches(masked, /\breturn\b/g).filter(
    (entry) => !isInsideRanges(entry.index, functionRanges),
  );
  const ctxRunjsCalls = findMatches(masked, /\bctx\s*(?:\?\.|\.)\s*runjs\s*(?:\?\.)?\(/g);
  const ctxRequestCalls = findMatches(masked, /\bctx\s*(?:\?\.|\.)\s*(?:api\s*(?:\?\.|\.)\s*)?request\s*(?:\?\.)?\(/g);
  const reactHookCalls = collectReactHookCalls(masked);
  const reactComponentAliases = collectReactComponentAliases(masked, sourceBindings);
  const flowResourceAliases = collectFlowResourceAliases(masked, sourceBindings);
  const directDomWrites = collectDirectDomWrites(source, masked, sourceBindings);
  const directDomAliases = collectDirectDomAliases(masked, sourceBindings);
  const windowDocumentNavigatorUses = collectWindowDocumentNavigatorUses(source, masked, sourceBindings);
  const windowDocumentNavigatorAliases = collectWindowDocumentNavigatorAliases(masked, sourceBindings);
  const ctxAliases = collectCtxAliases(masked, sourceBindings);
  const forbiddenBareGlobals = collectForbiddenBareGlobals(masked, sourceBindings);
  return {
    source,
    masked,
    functionRanges,
    blockRanges,
    sourceBindings,
    ctxRenderCalls,
    topLevelCtxRenderCalls,
    topLevelReturns,
    ctxRunjsCalls,
    ctxRequestCalls,
    invalidApiResourceCalls: collectInvalidApiResourceCalls(masked),
    invalidResourceTypeCalls: collectInvalidResourceTypeCalls(source, masked, stringLiteralBindings),
    invalidFlowResourceListCalls: collectInvalidFlowResourceListCalls(masked, flowResourceAliases),
    topLevelReactHookCalls: reactHookCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges)),
    unboundReactCreateElementCalls: collectUnboundReactCreateElementCalls(masked, sourceBindings),
    reactComponentFunctionCalls: collectReactComponentFunctionCalls(masked, reactComponentAliases),
    ctxRenderComponentSignatureCalls: collectCtxRenderComponentSignatureCalls(source, masked, reactComponentAliases),
    reactComponentPropReferences: collectReactComponentPropReferences(source, masked, reactComponentAliases),
    directDomWrites,
    directDomAliases,
    windowDocumentNavigatorUses,
    windowDocumentNavigatorAliases,
    ctxAliases,
    forbiddenBareGlobals,
    ctxMemberAccesses: collectCtxMemberAccesses(masked),
    dynamicCtxAccesses: findMatches(masked, /\bctx\s*(?:\?\.\s*)?\[/g),
    isTopLevelFunctionWrapper: isTopLevelFunctionWrapper(masked, functionRanges, topLevelCtxRenderCalls),
  };
}

function maskJavaScriptSource(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteral(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      const start = index;
      index = skipRegexLiteral(source, index);
      maskRange(start, index);
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

function maskJavaScriptComments(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteralComments(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

function maskTemplateLiteralComments(source: string, chars: string[], start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptComments(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

function maskTemplateLiteral(source: string, chars: string[], start: number) {
  const maskRange = (from: number, to: number) => {
    for (let index = from; index < to; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  maskRange(start, start + 1);
  let index = start + 1;
  let chunkStart = index;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      maskRange(chunkStart, index + 1);
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      maskRange(chunkStart, index + 2);
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptSource(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      if (expressionEnd < source.length) {
        maskRange(expressionEnd, expressionEnd + 1);
      }
      index = Math.min(source.length, expressionEnd + 1);
      chunkStart = index;
      continue;
    }
    index += 1;
  }
  maskRange(chunkStart, source.length);
  return source.length;
}

function findTemplateExpressionEnd(source: string, start: number) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    if (char === '`') {
      index = skipTemplateLiteral(source, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(source, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return source.length;
}

function skipRegexLiteral(source: string, start: number) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if ((char === '\n' || char === '\r') && !inCharacterClass) {
      return index;
    }
    if (char === '/' && !inCharacterClass) {
      index += 1;
      while (index < source.length && /[A-Za-z]/.test(source[index])) {
        index += 1;
      }
      return index;
    }
    index += 1;
  }
  return source.length;
}

function isRegexLiteralStart(sourceLike: string | string[], slashIndex: number) {
  const previous = getPreviousSignificantToken(sourceLike, slashIndex);
  if (!previous) {
    return true;
  }
  if (/^[([{=,:;!~?&|^+\-*%<>]$/.test(previous)) {
    return true;
  }
  return ['return', 'throw', 'case', 'delete', 'void', 'typeof', 'instanceof', 'yield', 'await', 'else'].includes(
    previous,
  );
}

function getPreviousSignificantToken(sourceLike: string | string[], beforeIndex: number) {
  return getPreviousSignificantTokenInfo(sourceLike, beforeIndex)?.token || '';
}

function getPreviousSignificantTokenInfo(sourceLike: string | string[], beforeIndex: number) {
  let index = beforeIndex - 1;
  while (index >= 0 && /\s/.test(sourceLike[index])) {
    index -= 1;
  }
  if (index < 0) {
    return undefined;
  }
  const char = sourceLike[index];
  if (/[A-Za-z_$]/.test(char)) {
    let start = index;
    while (start > 0 && /[\w$]/.test(sourceLike[start - 1])) {
      start -= 1;
    }
    return {
      token: Array.isArray(sourceLike)
        ? sourceLike.slice(start, index + 1).join('')
        : sourceLike.slice(start, index + 1),
      start,
      end: index + 1,
    };
  }
  return {
    token: char,
    start: index,
    end: index + 1,
  };
}

function skipQuotedLiteral(source: string, start: number, quote: string) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

function skipTemplateLiteral(source: string, start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionEnd = findTemplateExpressionEnd(source, index + 2);
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

function findFunctionRanges(masked: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  collectFunctionRanges(masked, /\bfunction\b[^{]*\{/g, ranges);
  collectFunctionRanges(masked, /=>\s*\{/g, ranges);
  collectArrowExpressionRanges(masked, ranges);
  collectMethodFunctionRanges(masked, ranges);
  return mergeRanges(ranges);
}

function collectFunctionRanges(masked: string, pattern: RegExp, ranges: SourceRange[]) {
  for (const match of masked.matchAll(pattern)) {
    const openBrace = masked.indexOf('{', match.index || 0);
    if (openBrace < 0) {
      continue;
    }
    const closeBrace = findMatchingBrace(masked, openBrace);
    if (closeBrace > openBrace) {
      ranges.push({ start: openBrace, end: closeBrace + 1 });
    }
  }
}

function collectArrowExpressionRanges(masked: string, ranges: SourceRange[]) {
  for (const match of masked.matchAll(/=>/g)) {
    let start = (match.index || 0) + match[0].length;
    while (start < masked.length && /\s/.test(masked[start])) {
      start += 1;
    }
    if (masked[start] === '{') {
      continue;
    }
    const end = findArrowExpressionEnd(masked, start);
    if (end > start) {
      ranges.push({ start, end });
    }
  }
}

function collectMethodFunctionRanges(masked: string, ranges: SourceRange[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    ranges.push(candidate.bodyRange);
  });
}

function collectMethodCandidates(masked: string) {
  const candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }> = [];
  const pattern = /\b(?:(?:static|async|get|set)\s+)*(?:\*\s*)?([A-Za-z_$][\w$]*)\s*\(/g;
  for (const match of masked.matchAll(pattern)) {
    const matchIndex = match.index || 0;
    const methodName = match[1];
    if (NON_METHOD_CALL_KEYWORDS.has(methodName)) {
      continue;
    }
    const previous = getPreviousSignificantToken(masked, matchIndex);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const openParen = masked.indexOf('(', matchIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
  collectComputedMethodCandidates(masked, candidates);
  return candidates;
}

function collectComputedMethodCandidates(
  masked: string,
  candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }>,
) {
  for (const match of masked.matchAll(/\[/g)) {
    const openBracket = match.index || 0;
    const previous = findMethodPrefixToken(masked, openBracket);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const closeBracket = findMatchingDelimiter(masked, openBracket);
    if (closeBracket <= openBracket) {
      continue;
    }
    let openParen = closeBracket + 1;
    while (openParen < masked.length && /\s/.test(masked[openParen])) {
      openParen += 1;
    }
    if (masked[openParen] !== '(') {
      continue;
    }
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
}

function findMethodPrefixToken(masked: string, beforeIndex: number) {
  let previous = getPreviousSignificantTokenInfo(masked, beforeIndex);
  while (previous && ['static', 'async', 'get', 'set', '*'].includes(previous.token)) {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  return previous?.token || '';
}

function findArrowExpressionEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';' || char === ',' || char === '\n' || char === '\r') {
        return index;
      }
      if (char === ')') {
        return index;
      }
    }
    if (char === '(') {
      parenDepth += 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
  }
  return masked.length;
}

function findMatchingBrace(masked: string, openBrace: number) {
  return findMatchingDelimiter(masked, openBrace);
}

function findMatchingDelimiter(masked: string, openIndex: number) {
  const closeByOpen: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };
  const stack = [closeByOpen[masked[openIndex]]];
  if (!stack[0]) {
    return -1;
  }
  for (let index = openIndex + 1; index < masked.length; index += 1) {
    const char = masked[index];
    if (closeByOpen[char]) {
      stack.push(closeByOpen[char]);
      continue;
    }
    if (char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) {
        return index;
      }
    }
  }
  return -1;
}

function collectBraceRanges(masked: string) {
  const ranges: SourceRange[] = [];
  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{') {
      continue;
    }
    const closeBrace = findMatchingDelimiter(masked, index);
    if (closeBrace > index) {
      ranges.push({ start: index, end: closeBrace + 1 });
    }
  }
  return ranges;
}

function mergeRanges(ranges: SourceRange[]) {
  const sorted = ranges.slice().sort((left, right) => left.start - right.start);
  const merged: SourceRange[] = [];
  sorted.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
      return;
    }
    merged.push({ ...range });
  });
  return merged;
}

function isInsideRanges(index: number, ranges: SourceRange[]) {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function findMatches(masked: string, pattern: RegExp) {
  return [...masked.matchAll(pattern)].map((match) => ({
    index: match.index || 0,
    match: match[0],
  }));
}

function collectSourceBindings(masked: string, functionRanges: SourceRange[], blockRanges: SourceRange[]) {
  const bindings: SourceBinding[] = [];
  for (const match of masked.matchAll(/\b(const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    const kind = match[1];
    const matchIndex = match.index || 0;
    if ((kind === 'function' || kind === 'class') && isNamedFunctionOrClassExpression(masked, matchIndex, kind)) {
      const expressionRange = findNamedFunctionOrClassExpressionRange(masked, matchIndex, kind);
      if (expressionRange) {
        bindings.push({
          name: match[2],
          start: expressionRange.start,
          end: expressionRange.end,
        });
      }
      continue;
    }
    addSourceBinding(bindings, functionRanges, blockRanges, masked, match[2], matchIndex, masked.length, kind);
  }
  collectDestructuredVariableBindingNames(masked, functionRanges, blockRanges, bindings);
  collectParameterBindingNames(masked, bindings);
  return bindings;
}

function collectStringLiteralBindings(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: StringLiteralBinding[] = [];
  const commentMasked = maskJavaScriptComments(source);
  for (const match of commentMasked.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])/g)) {
    const declarationIndex = match.index || 0;
    const literalStart = declarationIndex + match[0].lastIndexOf(match[2]);
    const statementEnd = findSingleStatementEnd(masked, declarationIndex);
    const literal = readCompleteStringLiteral(source.slice(literalStart, statementEnd));
    if (!literal) {
      continue;
    }
    const binding = bindings.find((entry) => entry.name === match[1] && entry.start === declarationIndex);
    entries.push({
      name: match[1],
      value: literal.value,
      start: binding?.start ?? declarationIndex,
      end: binding?.end ?? masked.length,
    });
  }
  return entries;
}

function isNamedFunctionOrClassExpression(masked: string, keywordIndex: number, kind: string) {
  let previous = getPreviousSignificantTokenInfo(masked, keywordIndex);
  if (kind === 'function' && previous?.token === 'async') {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  if (!previous) {
    return false;
  }
  return isExpressionPrefixToken(previous.token);
}

function isExpressionPrefixToken(token: string) {
  return (
    [
      '=',
      '(',
      '[',
      ',',
      ':',
      '?',
      'return',
      'throw',
      'yield',
      'await',
      'case',
      'new',
      'delete',
      'void',
      'typeof',
    ].includes(token) || /^[!~+\-*%&|^<>]$/.test(token)
  );
}

function findNamedFunctionOrClassExpressionRange(masked: string, keywordIndex: number, kind: string) {
  if (kind === 'function') {
    const openParen = masked.indexOf('(', keywordIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = closeParen > openParen ? findBraceBodyAfter(masked, closeParen) : undefined;
    return bodyRange ? { start: keywordIndex, end: bodyRange.end } : undefined;
  }

  const openBrace = masked.indexOf('{', keywordIndex);
  const closeBrace = findMatchingDelimiter(masked, openBrace);
  return closeBrace > openBrace ? { start: openBrace, end: closeBrace + 1 } : undefined;
}

function addSourceBinding(
  bindings: SourceBinding[],
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  masked: string,
  name: string,
  start: number,
  sourceEnd: number,
  kind: string,
) {
  const scope = resolveBindingScope(masked, sourceEnd, start, kind, functionRanges, blockRanges);
  bindings.push({
    name,
    start,
    end: scope.end,
  });
}

function resolveBindingScope(
  masked: string,
  sourceEnd: number,
  start: number,
  kind: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
): SourceRange {
  const forScope = ['const', 'let', 'class'].includes(kind)
    ? findForScopeForDeclaration(masked, start, blockRanges)
    : undefined;
  if (forScope) {
    return forScope;
  }
  if (['const', 'let', 'class'].includes(kind)) {
    return findInnermostRange(start, blockRanges) || { start: 0, end: sourceEnd };
  }
  return findInnermostRange(start, functionRanges) || { start: 0, end: sourceEnd };
}

function findForScopeForDeclaration(masked: string, start: number, blockRanges: SourceRange[]) {
  const forHeader = findForHeaderRangeContaining(masked, start);
  if (!forHeader) {
    return undefined;
  }
  const bodyRange = findFollowingStatementRange(masked, forHeader.end, blockRanges);
  return bodyRange ? { start: forHeader.start, end: bodyRange.end } : undefined;
}

function findForHeaderRangeContaining(masked: string, start: number) {
  for (const match of masked.matchAll(/\bfor\s*(?:await\s*)?\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (start > openParen && start < closeParen) {
      return { start: openParen + 1, end: closeParen };
    }
  }
  return undefined;
}

function findFollowingBraceRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  return masked[cursor] === '{' ? blockRanges.find((range) => range.start === cursor) : undefined;
}

function findFollowingStatementRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  const braceRange = findFollowingBraceRange(masked, afterIndex, blockRanges);
  if (braceRange) {
    return braceRange;
  }
  let start = afterIndex + 1;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (start >= masked.length) {
    return undefined;
  }
  const end = findSingleStatementEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

function findSingleStatementEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';') {
        return index + 1;
      }
      if (char === '\n' || char === '\r') {
        return index;
      }
    }
  }
  return masked.length;
}

function collectDestructuredVariableBindingNames(
  masked: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  bindings: SourceBinding[],
) {
  for (const match of masked.matchAll(/\b(const|let|var)\s*(\{|\[)/g)) {
    const start = (match.index || 0) + match[0].length - 1;
    const end = findMatchingDelimiter(masked, start);
    if (end > start) {
      extractBindingPatternNames(masked.slice(start, end + 1)).forEach((name) => {
        addSourceBinding(
          bindings,
          functionRanges,
          blockRanges,
          masked,
          name,
          match.index || 0,
          masked.length,
          match[1],
        );
      });
    }
  }
}

function collectParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\bfunction\b[^(]*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\bcatch\s*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  collectArrowParameterBindingNames(masked, bindings);
  collectMethodParameterBindingNames(masked, bindings);
}

function collectArrowParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\(/g)) {
    const openParen = match.index || 0;
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (closeParen <= openParen) {
      continue;
    }
    let cursor = closeParen + 1;
    while (cursor < masked.length && /\s/.test(masked[cursor])) {
      cursor += 1;
    }
    if (masked.slice(cursor, cursor + 2) !== '=>') {
      continue;
    }
    const bodyRange = findArrowBodyRange(masked, cursor + 2);
    if (bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) {
    const arrowIndex = (match.index || 0) + match[0].lastIndexOf('=>');
    const bodyRange = findArrowBodyRange(masked, arrowIndex + 2);
    if (bodyRange) {
      bindings.push({
        name: match[1],
        start: match.index || 0,
        end: bodyRange.end,
      });
    }
  }
}

function collectMethodParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    addParameterBindings(bindings, masked.slice(candidate.paramsStart, candidate.paramsEnd), {
      start: candidate.paramsStart,
      end: candidate.bodyRange.end,
    });
  });
}

function findBraceBodyAfter(masked: string, afterIndex: number): SourceRange | undefined {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] !== '{') {
    return undefined;
  }
  const closeBrace = findMatchingDelimiter(masked, cursor);
  return closeBrace > cursor ? { start: cursor, end: closeBrace + 1 } : undefined;
}

function findArrowBodyRange(masked: string, afterArrowIndex: number): SourceRange | undefined {
  let start = afterArrowIndex;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (masked[start] === '{') {
    const closeBrace = findMatchingDelimiter(masked, start);
    return closeBrace > start ? { start, end: closeBrace + 1 } : undefined;
  }
  const end = findArrowExpressionEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

function addParameterBindings(bindings: SourceBinding[], params: string, range: SourceRange) {
  splitTopLevel(params, ',').forEach((param) => {
    extractBindingPatternNames(param).forEach((name) => {
      bindings.push({ name, ...range });
    });
  });
}

function extractBindingPatternNames(pattern: string) {
  const names = new Set<string>();
  collectBindingPatternNames(pattern, names);
  return [...names];
}

function collectBindingPatternNames(pattern: string, names: Set<string>) {
  const trimmed = trimBindingElement(pattern);
  if (!trimmed) {
    return;
  }
  if (trimmed.startsWith('{')) {
    collectObjectBindingPatternNames(trimmed, names);
    return;
  }
  if (trimmed.startsWith('[')) {
    collectArrayBindingPatternNames(trimmed, names);
    return;
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  if (match) {
    names.add(match[1]);
  }
}

function collectObjectBindingPatternNames(pattern: string, names: Set<string>) {
  const body = stripEnclosure(pattern, '{', '}');
  splitTopLevel(body, ',').forEach((element) => {
    const trimmed = element.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith('...')) {
      collectBindingPatternNames(trimmed.slice(3), names);
      return;
    }
    const colon = findTopLevelChar(trimmed, ':');
    collectBindingPatternNames(colon >= 0 ? trimmed.slice(colon + 1) : trimmed, names);
  });
}

function collectArrayBindingPatternNames(pattern: string, names: Set<string>) {
  splitTopLevel(stripEnclosure(pattern, '[', ']'), ',').forEach((element) =>
    collectBindingPatternNames(element, names),
  );
}

function trimBindingElement(pattern: string) {
  const withoutRest = pattern
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  const equal = findTopLevelChar(withoutRest, '=');
  return (equal >= 0 ? withoutRest.slice(0, equal) : withoutRest).trim();
}

function stripEnclosure(pattern: string, open: string, close: string) {
  const trimmed = pattern.trim();
  return trimmed.startsWith(open) && trimmed.endsWith(close) ? trimmed.slice(1, -1) : trimmed;
}

function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function splitTopLevelWithRanges(value: string, separator: string) {
  const parts: CallArgumentSource[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ source: value.slice(start, index), start, end: index });
      start = index + 1;
    }
  }
  parts.push({ source: value.slice(start), start, end: value.length });
  return parts;
}

function findTopLevelChar(value: string, target: string) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index;
    }
  }
  return -1;
}

function findInnermostRange(index: number, ranges: SourceRange[]) {
  return ranges
    .filter((range) => index >= range.start && index < range.end)
    .sort((left, right) => left.end - left.start - (right.end - right.start))[0];
}

function isNameBoundAtIndex(bindings: SourceBinding[], name: string, index: number) {
  return bindings.some((binding) => binding.name === name && index >= binding.start && index < binding.end);
}

function collectForbiddenBareGlobals(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ name: string; index: number }> = [];
  for (const name of FORBIDDEN_BARE_GLOBALS) {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(name)}\\b`, 'g');
    for (const match of masked.matchAll(pattern)) {
      if (
        !isNameBoundAtIndex(bindings, name, match.index || 0) &&
        !isObjectPropertyKey(masked, match.index || 0, name)
      ) {
        entries.push({ name, index: match.index || 0 });
      }
    }
  }
  return entries.sort((left, right) => left.index - right.index);
}

function collectInvalidApiResourceCalls(masked: string) {
  return [
    ...masked.matchAll(
      /\bctx\s*(?:\?\.|\.)\s*api\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*(list|get|create|update|destroy)\s*(?:\?\.)?\(/g,
    ),
  ].map((match) => ({
    index: match.index || 0,
    match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    method: match[1],
  }));
}

function collectInvalidResourceTypeCalls(source: string, masked: string, stringBindings: StringLiteralBinding[]) {
  const entries: Array<{
    capability: string;
    expression?: string;
    index: number;
    message?: string;
    resourceType?: string;
    ruleId: string;
  }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    const capability = `ctx.${match[1]}`;
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      entries.push({
        capability,
        expression: '',
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate ${capability}(...) without a resource type`,
      });
      continue;
    }
    const resolved = resolveResourceTypeExpression(firstArg, stringBindings);
    if (resolved.status === 'unresolved') {
      entries.push({
        capability,
        expression: resolved.expression,
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate dynamic ${capability}(...) resource type '${resolved.expression}'`,
      });
      continue;
    }
    if (!FLOW_RESOURCE_CLASS_NAMES.has(resolved.value)) {
      entries.push({
        capability,
        index,
        resourceType: resolved.value,
        ruleId: 'runjs-make-resource-type-invalid',
        message: `flowSurfaces authoring ${capability}(...) expects a FlowResource class name, not collection '${resolved.value}'`,
      });
    }
  }
  return entries;
}

function resolveResourceTypeExpression(
  arg: CallArgumentSource,
  stringBindings: StringLiteralBinding[],
): { status: 'resolved'; value: string } | { status: 'unresolved'; expression: string } {
  const expression = arg.source.trim();
  const leadingLength = arg.source.length - arg.source.trimStart().length;
  const expressionIndex = arg.start + leadingLength;
  const literal = readCompleteStringLiteral(arg.source);
  if (literal) {
    return { status: 'resolved', value: literal.value };
  }
  if (/^[A-Za-z_$][\w$]*$/.test(expression)) {
    const binding = stringBindings.find(
      (entry) => entry.name === expression && expressionIndex >= entry.start && expressionIndex < entry.end,
    );
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  return {
    status: 'unresolved',
    expression,
  };
}

function collectFlowResourceAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: FlowResourceAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    const binding = bindings.find((entry) => entry.name === name && entry.start === declarationIndex);
    aliases.push({
      name,
      capability,
      start: binding?.start ?? declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g,
  )) {
    addAlias(match[1], `ctx.${match[2]}`, match.index || 0);
  }
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*resource\b/g,
  )) {
    addAlias(match[1], 'ctx.resource', match.index || 0);
  }
  return aliases;
}

function collectInvalidFlowResourceListCalls(masked: string, aliases: FlowResourceAlias[]) {
  const entries: Array<{ capability: string; index: number }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g)) {
    entries.push({
      index: match.index || 0,
      capability: 'ctx.resource.list',
    });
  }
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\([^)]*\)\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g,
  )) {
    entries.push({
      index: match.index || 0,
      capability: `ctx.${match[1]}(...).list`,
    });
  }
  aliases.forEach((alias) => {
    const pattern = new RegExp(
      `(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.|\\.)\\s*list\\s*(?:\\?\\.)?\\(`,
      'g',
    );
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      entries.push({
        index,
        capability: `${alias.name}.list`,
      });
    }
  });
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactHookCalls(masked: string) {
  const entries: Array<{ hook: string; index: number; match: string }> = [];
  const memberPattern = new RegExp(
    `\\b(?:(?:ctx\\s*(?:\\?\\.|\\.)\\s*(?:libs\\s*(?:\\?\\.|\\.)\\s*)?React)|React)\\s*(?:\\?\\.|\\.)\\s*(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`,
    'g',
  );
  for (const match of masked.matchAll(memberPattern)) {
    const index = match.index || 0;
    entries.push({
      hook: match[1],
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  const barePattern = new RegExp(`(?<![.$\\w])(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`, 'g');
  for (const match of masked.matchAll(barePattern)) {
    const index = match.index || 0;
    const hook = match[1];
    if (getPreviousSignificantToken(masked, index) === 'function' || isObjectPropertyKey(masked, index, hook)) {
      continue;
    }
    entries.push({
      hook,
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectUnboundReactCreateElementCalls(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number }> = [];
  for (const match of masked.matchAll(/(?<![.$\w])React\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (!isNameBoundAtIndex(bindings, 'React', index)) {
      entries.push({ index });
    }
  }
  return entries;
}

function collectReactComponentAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: ReactComponentAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    if (!/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const binding = bindings.find((entry) => entry.name === name && entry.start === declarationIndex);
    aliases.push({
      name,
      capability,
      start: binding?.start ?? declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\b/g,
  )) {
    const declarationIndex = match.index || 0;
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    collectObjectBindingAliases(match[1]).forEach((alias) =>
      addAlias(alias, `${namespace}.${alias}`, declarationIndex),
    );
  }

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Z][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\b/g,
  )) {
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    addAlias(match[1], `${namespace}.${match[4]}`, match.index || 0);
  }

  return aliases;
}

function collectReactComponentFunctionCalls(masked: string, aliases: ReactComponentAlias[]) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\s*(?:\?\.)?\(/g,
  )) {
    const namespace = `ctx.${match[1] ? 'libs.' : ''}${match[2]}`;
    entries.push({
      index: match.index || 0,
      component: match[3],
      capability: `${namespace}.${match[3]}`,
    });
  }

  aliases.forEach((alias) => {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.)?\\(`, 'g');
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      const previous = getPreviousSignificantToken(masked, index);
      if (previous === 'function' || isObjectPropertyKey(masked, index, alias.name)) {
        continue;
      }
      entries.push({
        index,
        component: alias.name,
        capability: alias.capability,
      });
    }
  });

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectCtxRenderComponentSignatureCalls(source: string, masked: string, aliases: ReactComponentAlias[]) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      continue;
    }
    const reference = readReactComponentReference(firstArg.source, aliases, firstArg.start);
    if (reference) {
      entries.push({
        index: firstArg.start,
        ...reference,
      });
    }
  }
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactComponentPropReferences(source: string, masked: string, aliases: ReactComponentAlias[]) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const inspectPropsArg = (arg: CallArgumentSource | undefined) => {
    if (!arg) {
      return;
    }
    collectReactComponentPropReferencesFromObject(arg, aliases).forEach((entry) => entries.push(entry));
  };

  for (const match of masked.matchAll(
    /\b(?:(?:ctx\s*(?:\?\.|\.)\s*(?:libs\s*(?:\?\.|\.)\s*)?React)|React)\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g,
  )) {
    inspectPropsArg(getCallArgumentSources(source, masked, match.index || 0)[1]);
  }

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    const args = getCallArgumentSources(source, masked, match.index || 0);
    if (!readReactComponentReference(args[0]?.source || '', aliases, args[0]?.start || 0)) {
      continue;
    }
    inspectPropsArg(args[1]);
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactComponentPropReferencesFromObject(arg: CallArgumentSource, aliases: ReactComponentAlias[]) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const localMasked = maskJavaScriptSource(arg.source);
  const openOffset = arg.source.search(/\S/);
  if (openOffset < 0 || arg.source[openOffset] !== '{') {
    return entries;
  }
  const closeOffset = findMatchingDelimiter(localMasked, openOffset);
  if (closeOffset <= openOffset) {
    return entries;
  }
  const body = arg.source.slice(openOffset + 1, closeOffset);
  const bodyStart = arg.start + openOffset + 1;
  splitTopLevelWithRanges(body, ',').forEach((property) => {
    const colon = findTopLevelChar(property.source, ':');
    if (colon < 0) {
      return;
    }
    const propName = normalizeObjectPropertyName(property.source.slice(0, colon));
    if (!REACT_NODE_COMPONENT_PROP_NAMES.has(propName)) {
      return;
    }
    const rawValue = property.source.slice(colon + 1);
    const leading = rawValue.length - rawValue.trimStart().length;
    const valueStart = bodyStart + property.start + colon + 1 + leading;
    const reference = readReactComponentReference(rawValue, aliases, valueStart);
    if (!reference) {
      return;
    }
    entries.push({
      index: valueStart,
      prop: propName,
      ...reference,
    });
  });
  return entries;
}

function readReactComponentReference(
  expression: string,
  aliases: ReactComponentAlias[],
  expressionIndex: number,
): { component: string; capability: string } | undefined {
  const normalized = maskJavaScriptComments(expression).trim();
  const ctxMatch = normalized.match(
    /^ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)$/,
  );
  if (ctxMatch) {
    const namespace = `ctx.${ctxMatch[1] ? 'libs.' : ''}${ctxMatch[2]}`;
    return {
      component: ctxMatch[3],
      capability: `${namespace}.${ctxMatch[3]}`,
    };
  }

  const aliasMatch = normalized.match(/^([A-Z][\w$]*)$/);
  if (!aliasMatch) {
    return undefined;
  }
  const alias = aliases.find(
    (entry) => entry.name === aliasMatch[1] && expressionIndex >= entry.start && expressionIndex < entry.end,
  );
  return alias
    ? {
        component: alias.name,
        capability: alias.capability,
      }
    : undefined;
}

function normalizeObjectPropertyName(value: string) {
  return value.trim().replace(/^['"]([A-Za-z_$][\w$]*)['"]$/, '$1');
}

function dedupeIndexedEntries<T extends { index: number; match?: string; capability?: string; component?: string }>(
  entries: T[],
) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.index}:${entry.match || ''}:${entry.capability || ''}:${entry.component || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isObjectPropertyKey(masked: string, index: number, name: string) {
  let cursor = index + name.length;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] === ':') {
    return true;
  }
  if (masked[cursor] !== '(') {
    return false;
  }
  const previous = getPreviousSignificantToken(masked, index);
  return previous === '{' || previous === ',';
}

function collectDirectDomWrites(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number; match: string }> = [];
  const commentMasked = maskJavaScriptComments(source);
  const pattern =
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|\b(document)\s*(?:\?\.|\.)\s*(createElement)\b|\b(element)\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|(?<![.$\w])(insertAdjacentHTML)\s*(?:\?\.)?\(/g;
  for (const match of masked.matchAll(pattern)) {
    const index = match.index || 0;
    const boundRoot = match[3] || match[5];
    const bareFunction = match[7];
    if (
      (boundRoot && isNameBoundAtIndex(bindings, boundRoot, index)) ||
      (bareFunction && isNameBoundAtIndex(bindings, bareFunction, index))
    ) {
      continue;
    }
    entries.push({ index, match: match[0].replace(/\s*(?:\?\.)?\($/, '') });
  }
  for (const match of commentMasked.matchAll(
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (isCodeTokenAt(masked, index, 'ctx') && (dynamicMember || isDirectDomMember(member))) {
      entries.push({ index, match: match[0] });
    }
  }
  for (const match of commentMasked.matchAll(
    /\b(document)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || member === 'createElement')
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  for (const match of commentMasked.matchAll(
    /\b(element)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || isDirectDomMember(member))
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  return entries;
}

function collectWindowDocumentNavigatorUses(source: string, masked: string, bindings: SourceBinding[]) {
  const commentMasked = maskJavaScriptComments(source);
  const entries = [...masked.matchAll(/\b(window|document|navigator)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => !isNameBoundAtIndex(bindings, match[1], match.index || 0))
    .map((match) => ({
      root: match[1],
      member: match[2],
      index: match.index || 0,
    }));
  for (const match of commentMasked.matchAll(
    /\b(window|document|navigator)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const root = match[1];
    if (!isCodeTokenAt(masked, index, root) || isNameBoundAtIndex(bindings, root, index)) {
      continue;
    }
    entries.push({
      root,
      member: match[3] || '[dynamic]',
      index,
    });
  }
  return entries.sort((left, right) => left.index - right.index);
}

function collectWindowDocumentNavigatorAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; root: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
    ],
    (match) => {
      const alias = match[1];
      const root = match[2];
      const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
      if (alias === root || isNameBoundAtIndex(bindings, root, rootIndex)) {
        return;
      }
      entries.push({ alias, root, index: rootIndex });
    },
  );
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(window|document|navigator)\b(?!\s*(?:\.|\?\.))/g,
  )) {
    const root = match[2];
    const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
    if (isNameBoundAtIndex(bindings, root, rootIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, root, index: rootIndex });
    });
  }
  return dedupeAliasEntries(entries);
}

function collectDirectDomAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1])
      .filter((alias) => alias === 'element')
      .forEach((alias) => {
        entries.push({ alias, index: ctxIndex });
      });
  }
  return dedupeAliasEntries(entries);
}

function collectCtxAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (alias === 'ctx' || isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, index: ctxIndex });
    });
  }
  return dedupeAliasEntries(entries);
}

function collectAliasMatches(
  masked: string,
  patterns: RegExp[],
  onMatch: (match: RegExpMatchArray & { index?: number }) => void,
) {
  patterns.forEach((pattern) => {
    for (const match of masked.matchAll(pattern)) {
      onMatch(match);
    }
  });
}

function dedupeAliasEntries<T extends { alias: string; index: number }>(entries: T[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.alias}:${entry.index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectObjectBindingAliases(pattern: string) {
  return splitTopLevel(pattern, ',')
    .flatMap((element) => collectObjectBindingElementAliases(element))
    .filter(Boolean);
}

function collectObjectBindingElementAliases(element: string): string[] {
  const trimmed = element
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  if (!trimmed || trimmed.startsWith('{')) {
    return [];
  }
  const colon = findTopLevelChar(trimmed, ':');
  if (colon >= 0) {
    const right = trimBindingElement(trimmed.slice(colon + 1));
    const match = right.match(/^([A-Za-z_$][\w$]*)\b/);
    return match ? [match[1]] : [];
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  return match ? [match[1]] : [];
}

function isDirectDomMember(member: string) {
  return member === 'innerHTML' || member === 'insertAdjacentHTML';
}

function isCodeTokenAt(masked: string, index: number, token: string) {
  return masked.slice(index, index + token.length) === token;
}

function collectCtxMemberAccesses(masked: string) {
  return [...masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)].map((match) => ({
    member: match[1],
    index: match.index || 0,
  }));
}

function isTopLevelFunctionWrapper(masked: string, functionRanges: SourceRange[], topLevelCtxRenderCalls: any[]) {
  if (topLevelCtxRenderCalls.length || !functionRanges.length) {
    return false;
  }
  return /^\s*(?:async\s+)?function\b/.test(masked) || /^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=/.test(masked);
}

function resolveFieldModelUse(type: string, renderer: string, blockType: string) {
  if (type === 'jsColumn') {
    return 'JSColumnModel';
  }
  if (type === 'jsItem') {
    return 'JSItemModel';
  }
  if (renderer === 'js') {
    return ['createForm', 'editForm'].includes(blockType) ? 'JSEditableFieldModel' : 'JSFieldModel';
  }
  return '';
}

function resolveActionModelUse(actionType: string, blockType: string, slot: 'actions' | 'recordActions') {
  if (actionType === 'jsItem') {
    return 'JSItemActionModel';
  }
  if (actionType !== 'js') {
    return '';
  }
  if (slot === 'recordActions') {
    return 'JSRecordActionModel';
  }
  if (['createForm', 'editForm'].includes(blockType)) {
    return 'JSFormActionModel';
  }
  if (blockType === 'filterForm') {
    return 'FilterFormJSActionModel';
  }
  if (['table', 'list', 'gridCard', 'calendar', 'kanban'].includes(blockType)) {
    return 'JSCollectionActionModel';
  }
  return 'JSActionModel';
}

function resolveConfigureModelUse(currentNode: any) {
  const currentUse = normalizeText(currentNode?.use);
  if (KNOWN_MODEL_USES.has(currentUse)) {
    return currentUse;
  }
  const fieldUse = normalizeText(currentNode?.subModels?.field?.use);
  if (KNOWN_MODEL_USES.has(fieldUse)) {
    return fieldUse;
  }
  return '';
}

function resolveConfigureBlockType(context: RunJsAuthoringContext) {
  const hostBlockType = normalizeText(context.hostBlockType);
  if (hostBlockType) {
    return resolvePublicBlockType(hostBlockType);
  }
  const currentUse = normalizeText(context.currentNode?.use);
  return resolvePublicBlockType(currentUse);
}

function resolvePublicBlockType(value: any) {
  const normalized = normalizeText(value);
  return PUBLIC_BLOCK_TYPE_BY_MODEL_USE[normalized] || normalized;
}

function resolveSurfaceStyle(input: RunJsAuthoringInspectionInput): RunJsAuthoringSurfaceStyle | undefined {
  if (input.surfaceStyle) {
    return input.surfaceStyle;
  }
  const surface = normalizeText(input.surface);
  if (surface && SURFACE_STYLE_BY_ID[surface]) {
    return SURFACE_STYLE_BY_ID[surface];
  }
  return resolveModelSurfaceStyle(input.modelUse);
}

function resolveModelSurfaceStyle(modelUse: any): RunJsAuthoringSurfaceStyle | undefined {
  const normalized = normalizeText(modelUse);
  if (RENDER_MODEL_USES.has(normalized)) {
    return 'render';
  }
  if (ACTION_MODEL_USES.has(normalized)) {
    return 'action';
  }
  if (VALUE_MODEL_USES.has(normalized)) {
    return 'value';
  }
  return undefined;
}

function normalizeActionType(value: any) {
  const normalized = normalizeText(value);
  return ACTION_TYPE_ALIASES.get(normalized.toLowerCase()) || normalized;
}

function normalizeText(value: any) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildRunJsAuthoringError(input: {
  path: string;
  repairClass: RunJsAuthoringRepairClass;
  message: string;
  modelUse?: string;
  surface?: string;
  index: number;
  source: string;
  ruleId?: string;
  details?: Record<string, any>;
}): FlowSurfaceErrorItemInput {
  const rule = getRunJsAuthoringRule(input.repairClass);
  const loc = getLineColumn(input.source, input.index);
  return {
    path: input.path,
    ruleId: input.ruleId || rule.defaultRuleId,
    message: input.message,
    details: buildDefinedDetails({
      repairClass: input.repairClass,
      suggestedAction: rule.suggestedAction,
      line: loc.line,
      column: loc.column,
      ...input.details,
    }),
  };
}

function buildDefinedDetails(details: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => typeof value !== 'undefined' && value !== ''),
  );
}

function getLineColumn(source: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, source.length));
  const prefix = source.slice(0, safeIndex);
  const lines = prefix.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function dedupeErrors(errors: FlowSurfaceErrorItemInput[]) {
  const seen = new Set<string>();
  return errors.filter((error) => {
    const key = `${error.path}:${error.ruleId}:${error.details?.line}:${error.details?.column}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isResourceLikeCtxRequest(source: string, masked: string, index: number) {
  const args = getCallArgumentSource(source, masked, index);
  if (!args) {
    return false;
  }
  const urlMatch = args.match(/\burl\s*:\s*(['"`])([^'"`]+)\1/i) || args.match(/^\s*(['"`])([^'"`]+)\1\s*$/);
  if (urlMatch) {
    const url = urlMatch[2].trim();
    if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('/')) {
      return false;
    }
    if (/^[A-Za-z_$][\w$.-]*:(?:list|get)(?:\b|[/?#])/i.test(url)) {
      return true;
    }
    return false;
  }
  return /\b(?:resource|collectionName|collection)\s*:/i.test(args);
}

function getResourceLikeCtxRunjsEntrypoint(source: string, masked: string, index: number) {
  const firstArg = getCallFirstArgumentSource(source, masked, index);
  if (!firstArg) {
    return '';
  }
  const literal = readLeadingStringLiteral(firstArg);
  if (literal) {
    const endpoint = literal.value.trim();
    return isResourceLikeRunjsEntrypoint(endpoint) ? endpoint : '';
  }
  const expression = firstArg.trim();
  return isResourceLikeRunjsEntrypointExpression(expression) ? expression : '';
}

function readLeadingStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const quote = value[index];
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return undefined;
  }
  let cursor = index + 1;
  let output = '';
  while (cursor < value.length) {
    const char = value[cursor];
    if (char === '\\') {
      output += value.slice(cursor, Math.min(value.length, cursor + 2));
      cursor += 2;
      continue;
    }
    if (char === quote) {
      return {
        value: output,
        end: cursor + 1,
      };
    }
    output += char;
    cursor += 1;
  }
  return undefined;
}

function readCompleteStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const literal = readLeadingStringLiteral(value);
  if (!literal) {
    return undefined;
  }
  const rawLiteral = value.slice(index, literal.end);
  if (rawLiteral.startsWith('`') && rawLiteral.includes('${')) {
    return undefined;
  }
  const rest = value.slice(literal.end);
  if (/^[ \t]*(?:\r\n|\r|\n)/.test(rest)) {
    return literal;
  }
  const restIndex = skipJavaScriptTrivia(rest, 0);
  const next = rest[restIndex];
  if (!next || /[,;)\]}]/.test(next)) {
    return literal;
  }
  return undefined;
}

function isResourceLikeRunjsEntrypoint(value: string) {
  const trimmed = value.trim();
  const action = RUNJS_RESOURCE_ACTION_PATTERN;
  return (
    new RegExp(`^(?:resource|collection):${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`^[A-Za-z_$][\\w$.-]*:${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`\\$\\{[^}]+\\}\\s*:${action}(?:$|[/?#])`, 'i').test(trimmed)
  );
}

function isResourceLikeRunjsEntrypointExpression(value: string) {
  const withoutComments = maskJavaScriptComments(value);
  return new RegExp(`(['"\`])\\s*:${RUNJS_RESOURCE_ACTION_PATTERN}\\1`).test(withoutComments);
}

function skipJavaScriptTrivia(value: string, start: number) {
  let index = start;
  while (index < value.length) {
    while (index < value.length && /\s/.test(value[index])) {
      index += 1;
    }
    if (value[index] === '/' && value[index + 1] === '/') {
      index += 2;
      while (index < value.length && value[index] !== '\n' && value[index] !== '\r') {
        index += 1;
      }
      continue;
    }
    if (value[index] === '/' && value[index + 1] === '*') {
      index += 2;
      while (index < value.length && !(value[index] === '*' && value[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(value.length, index + 2);
      continue;
    }
    return index;
  }
  return index;
}

function getCallFirstArgumentSource(source: string, masked: string, index: number) {
  return getCallArgumentSources(source, masked, index)[0]?.source || '';
}

function getCallArgumentSources(source: string, masked: string, index: number) {
  const args: CallArgumentSource[] = [];
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return args;
  }
  let parenDepth = 1;
  let bracketDepth = 0;
  let braceDepth = 0;
  let argStart = openParen + 1;
  for (let cursor = openParen + 1; cursor < masked.length; cursor += 1) {
    const char = masked[cursor];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
      if (parenDepth === 0) {
        if (cursor > argStart || source.slice(argStart, cursor).trim()) {
          args.push({
            source: source.slice(argStart, cursor),
            start: argStart,
            end: cursor,
          });
        }
        return args;
      }
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === ',' && parenDepth === 1 && bracketDepth === 0 && braceDepth === 0) {
      args.push({
        source: source.slice(argStart, cursor),
        start: argStart,
        end: cursor,
      });
      argStart = cursor + 1;
    }
  }
  return args;
}

function getCallArgumentSource(source: string, masked: string, index: number) {
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return '';
  }
  let depth = 0;
  for (let cursor = openParen; cursor < masked.length; cursor += 1) {
    if (masked[cursor] === '(') {
      depth += 1;
    } else if (masked[cursor] === ')') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openParen + 1, cursor);
      }
    }
  }
  return '';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
