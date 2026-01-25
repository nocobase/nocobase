/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { FilterGroupType } from '@nocobase/utils/client';
import type { FieldAssignRuleItem } from '../../../components/FieldAssignRulesEditor';

function createEmptyCondition(): FilterGroupType {
  return { logic: '$and', items: [] };
}

export interface LegacyValueExtractor {
  (model: any): any | undefined;
}

export interface LegacyClearer {
  (model: any): void;
}

function getPropsInitialValue(model: any): any | undefined {
  if (!model) return undefined;
  const props = typeof model.getProps === 'function' ? model.getProps() : model.props;
  if (props && typeof props.initialValue !== 'undefined') {
    return props.initialValue;
  }
  return undefined;
}

function getStepParamsInitialValue(model: any, flowKey: string): any | undefined {
  if (!model) return undefined;
  return model.getStepParams?.(flowKey, 'initialValue')?.defaultValue;
}

export function createLegacyValueExtractor(flowKeys: string[]): LegacyValueExtractor {
  return (model: any): any | undefined => {
    if (!model) return undefined;

    const propsValue = getPropsInitialValue(model);
    if (typeof propsValue !== 'undefined') {
      return propsValue;
    }

    for (const flowKey of flowKeys) {
      const stepValue = getStepParamsInitialValue(model, flowKey);
      if (typeof stepValue !== 'undefined') {
        return stepValue;
      }
    }

    return undefined;
  };
}

function deleteStepParams(model: any, flowKey: string, stepKey: string) {
  if (!model?.stepParams?.[flowKey]) return;
  const flow = model.stepParams[flowKey];
  if (!flow || typeof flow !== 'object') return;
  if (!Object.prototype.hasOwnProperty.call(flow, stepKey)) return;

  delete flow[stepKey];
  if (_.isEmpty(flow)) {
    delete model.stepParams[flowKey];
  }
  model.emitter?.emit?.('onStepParamsChanged');
}

export function createLegacyClearer(flowKeys: string[]): LegacyClearer {
  return (model: any): void => {
    if (!model) return;

    model.setProps?.({ initialValue: undefined });

    if (model.props && Object.prototype.hasOwnProperty.call(model.props, 'initialValue')) {
      delete model.props.initialValue;
    }

    for (const flowKey of flowKeys) {
      deleteStepParams(model, flowKey, 'initialValue');
    }
  };
}

export function collectLegacyDefaultValueRules(formModel: any, extractor: LegacyValueExtractor): FieldAssignRuleItem[] {
  const items = formModel?.subModels?.grid?.subModels?.items;
  const list: any[] = Array.isArray(items) ? items : [];
  const result: FieldAssignRuleItem[] = [];

  for (const item of list) {
    const fieldPath = item?.getStepParams?.('fieldSettings', 'init')?.fieldPath || item?.fieldPath;
    const targetPath = fieldPath ? String(fieldPath) : '';
    if (!targetPath) continue;

    const legacyValue = extractor(item);
    if (typeof legacyValue === 'undefined') continue;

    result.push({
      key: `legacy-default:${targetPath}`,
      enable: true,
      targetPath,
      mode: 'default',
      condition: createEmptyCondition(),
      value: legacyValue,
    });
  }

  return result;
}

export function mergeAssignRulesWithLegacyDefaults(
  existing: FieldAssignRuleItem[] | undefined,
  legacyDefaults: FieldAssignRuleItem[],
): FieldAssignRuleItem[] {
  const base = Array.isArray(existing) ? existing : [];
  const legacy = Array.isArray(legacyDefaults) ? legacyDefaults : [];
  if (!legacy.length) return base;

  // 已存在的“默认值语义”目标字段：
  // - 显式 default 模式规则
  // - 或者带 legacy-default: 前缀的迁移规则（即使在某些场景被强制改成 assign，也应视为已迁移）
  const existingDefaultTargets = new Set<string>();
  for (const it of base) {
    if (!it || typeof it !== 'object') continue;
    const targetPath = it.targetPath ? String(it.targetPath) : '';
    if (!targetPath) continue;
    if (it.mode === 'default') {
      existingDefaultTargets.add(targetPath);
      continue;
    }
    if (String(it.key ?? '').startsWith('legacy-default:')) {
      existingDefaultTargets.add(targetPath);
    }
  }
  const existingKeys = new Set(base.map((it) => String(it.key ?? '')));

  const toAdd: FieldAssignRuleItem[] = [];
  for (const it of legacy) {
    const targetPath = it.targetPath ? String(it.targetPath) : '';
    if (!targetPath) continue;
    if (existingDefaultTargets.has(targetPath)) continue;

    const next: FieldAssignRuleItem = { ...it };
    const k = String(next.key ?? '');
    if (k && existingKeys.has(k)) {
      next.key = `${k}:${targetPath}`;
    }
    toAdd.push(next);
  }

  if (!toAdd.length) return base;
  return [...base, ...toAdd];
}

export function clearLegacyDefaultValues(
  formModel: any,
  extractor: LegacyValueExtractor,
  clearer: LegacyClearer,
): any[] {
  const items = formModel?.subModels?.grid?.subModels?.items;
  const list: any[] = Array.isArray(items) ? items : [];
  const cleared: any[] = [];

  for (const item of list) {
    const legacyValue = extractor(item);
    if (typeof legacyValue === 'undefined') continue;
    clearer(item);
    cleared.push(item);
  }

  return cleared;
}
