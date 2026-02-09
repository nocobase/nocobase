/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 从 assignRules 的 targetPath 推导需要注入到请求中的 updateAssociationValues。
 *
 * 规则：仅当 targetPath 穿过至少一段关联字段（association）时返回该关联路径：
 * - user.name -> user
 * - user.profile.name -> user.profile
 */
export function collectUpdateAssociationValuesFromAssignRules(
  items: Array<{ targetPath?: string } | any>,
  rootCollection: any,
): string[] {
  const list = Array.isArray(items) ? items : [];
  const out = new Set<string>();

  const getDeepestAssociationPath = (targetPath: string): string | null => {
    if (!rootCollection || typeof rootCollection.getField !== 'function') return null;
    if (typeof targetPath !== 'string' || !targetPath.includes('.')) return null;

    const segs = targetPath.split('.').filter(Boolean);
    if (segs.length < 2) return null;

    let cur = rootCollection;
    const assocSegs: string[] = [];
    let deepest: string | null = null;
    let deepestField: any | null = null;

    // 只遍历到倒数第二段：最后一段视为“属性字段”
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      const cf = cur?.getField?.(seg);
      if (!cf?.isAssociationField?.() || !cf?.targetCollection) break;
      assocSegs.push(seg);
      deepest = assocSegs.join('.');
      deepestField = cf;
      cur = cf.targetCollection;
    }

    // 特殊：targetPath 仅写入关联对象的 targetKey/filterTargetKey（如 user.id），不属于“更新关联对象属性”，无需注入 updateAssociationValues。
    // 这种场景通常代表“通过主键选中关联记录”。
    if (deepest && deepestField) {
      const lastSeg = segs[segs.length - 1];
      const rawKey = deepestField?.targetKey ?? deepestField?.targetCollection?.filterTargetKey ?? 'id';
      const keyFields = Array.isArray(rawKey)
        ? rawKey.filter((v: any) => typeof v === 'string' && !!v)
        : typeof rawKey === 'string' && rawKey
          ? [rawKey]
          : ['id'];
      if (typeof lastSeg === 'string' && keyFields.includes(lastSeg)) {
        return null;
      }
    }

    return deepest;
  };

  for (const it of list) {
    const targetPath = it?.targetPath ? String(it.targetPath) : '';
    if (!targetPath) continue;
    const assoc = getDeepestAssociationPath(targetPath);
    if (assoc) out.add(assoc);
  }

  return Array.from(out);
}
