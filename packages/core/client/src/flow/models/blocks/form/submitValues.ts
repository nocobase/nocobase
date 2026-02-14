/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { resolveDynamicNamePath } from './value-runtime/path';
import type { NamePath } from './value-runtime/types';
import type { FormBlockModel } from './FormBlockModel';

function isInSameBlock(model: any, blockModel: FormBlockModel): boolean {
  const modelBlockUid = model?.context?.blockModel?.uid;
  const blockUid = blockModel?.uid;
  if (!modelBlockUid || !blockUid) return false;
  return String(modelBlockUid) === String(blockUid);
}

function tryGetModelTargetPathCandidate(model: any): string | NamePath | null {
  const fpArray = model?.context?.fieldPathArray;
  if (Array.isArray(fpArray) && fpArray.length) {
    return fpArray as NamePath;
  }

  try {
    const init = model?.getStepParams?.('fieldSettings', 'init') as any;
    const fp = init?.fieldPath;
    if (typeof fp === 'string' && fp) return fp;
  } catch {
    // ignore
  }

  const fp2 = (model as any)?.fieldPath;
  if (typeof fp2 === 'string' && fp2) return fp2;

  const props = typeof model?.getProps === 'function' ? model.getProps() : model?.props;
  const name = props?.name;
  if (typeof name === 'string' && name) return name;
  if (Array.isArray(name) && name.length) return name as NamePath;

  return null;
}

function normalizeResolvedNamePath(namePath: NamePath | null): NamePath | null {
  if (!Array.isArray(namePath) || !namePath.length) return null;
  // Guard: form values are keyed by string at top-level; a numeric-leading path is very likely wrong.
  if (typeof namePath[0] !== 'string') return null;
  return namePath;
}

function resolveModelNamePath(model: any): NamePath | null {
  const candidate = tryGetModelTargetPathCandidate(model);
  if (!candidate) return null;

  const resolved = resolveDynamicNamePath(candidate as any, model?.context?.fieldIndex);
  return normalizeResolvedNamePath(resolved as any);
}

function cleanupEmptyPlainObjectAncestors(values: any, namePath: NamePath) {
  if (!values || typeof values !== 'object') return;
  if (!Array.isArray(namePath) || namePath.length < 2) return;

  // 从叶子往上清理：仅清理“祖先最后一段是 string 的对象属性”，跳过 number 祖先（避免数组空洞/重排风险）
  for (let len = namePath.length - 1; len >= 1; len--) {
    const ancestor = namePath.slice(0, len);
    const last = ancestor[ancestor.length - 1];
    if (typeof last === 'number') continue;

    const current = _.get(values, ancestor as any);
    if (!_.isPlainObject(current)) continue;
    if (Object.keys(current).length !== 0) continue;

    _.unset(values, ancestor as any);
  }
}

function forEachModelIncludingForks(engine: any, visitor: (model: any) => void) {
  if (!engine?.forEachModel) return;
  engine.forEachModel((model: any) => {
    visitor(model);

    const forks: any = model?.forks;
    if (forks && typeof forks.forEach === 'function') {
      forks.forEach((fork: any) => visitor(fork));
    }
  });
}

/**
 * 提交前过滤：移除当前表单 block 中被「联动规则隐藏」的字段值（`model.hidden === true`）。
 *
 * 说明：
 * - 仅对 “隐藏 / Hidden” 生效（对应 `model.hidden=true`）。
 * - “隐藏并保留值 / Hidden (reserved value)” 在实现上是 `props.hidden=true` 但 `model.hidden=false`，
 *   因此仍会提交（保持现有语义）。
 * - 不会清空 antd Form 的内部 store，只影响本次提交 payload。
 */
export function omitHiddenModelValuesFromSubmit<T = any>(values: T, blockModel: FormBlockModel): T {
  if (!values || typeof values !== 'object') return values;
  const engine = blockModel?.flowEngine;
  if (!engine?.forEachModel) return values;

  const paths: NamePath[] = [];
  const seen = new Set<string>();

  forEachModelIncludingForks(engine, (model: any) => {
    if (!model || typeof model !== 'object') return;
    if (!model.hidden) return;
    if (!isInSameBlock(model, blockModel)) return;

    const namePath = resolveModelNamePath(model);
    if (!namePath) return;

    const key = JSON.stringify(namePath);
    if (seen.has(key)) return;
    seen.add(key);
    paths.push(namePath);
  });

  if (!paths.length) return values;

  const next: any = _.cloneDeep(values);
  for (const p of paths) {
    _.unset(next, p as any);
    cleanupEmptyPlainObjectAncestors(next, p);
  }
  return next;
}
