/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, CollectionField } from '../data-source';
import _ from 'lodash';
import type { FlowContext, PropertyMeta, PropertyMetaFactory } from '../flowContext';
import { createCollectionContextMeta } from './createCollectionContextMeta';

/**
 * 提取变量子路径的顶层字段名。
 * 例如：
 * - 'author.name'  => 'author'
 * - 'tags[0].name' => 'tags'
 *
 * @param subPath 变量在对象中的子路径字符串
 * @returns 顶层字段名，找不到时返回 undefined
 */
function baseFieldNameOf(subPath: string): string | undefined {
  if (!subPath) return undefined;
  const m = subPath.match(/^([^.[]+)/);
  return m?.[1];
}

/**
 * 在集合中根据字段名查找字段定义，兼容 getField/getFields 两种方式。
 *
 * @param collection 集合对象
 * @param name 字段名
 * @returns 匹配的字段定义，找不到时返回 undefined
 */
function findFieldByName(collection: Collection | null | undefined, name?: string): CollectionField | undefined {
  if (!collection || !name) return undefined;
  const direct = collection.getField(name);
  if (direct) return direct;
  const fields = collection.getFields?.() || [];
  return fields.find((f) => f.name === name);
}

/**
 * 从值中提取主键：
 * - 支持主键原始值（string/number）
 * - 支持对象（按主键名取值）
 *
 * @param value 字段当前值
 * @param primaryKey 主键字段名
 * @returns 解析出的主键值，无法解析时返回 undefined
 */
function toFilterByTk(value: unknown, primaryKey: string | string[]) {
  if (value == null) return undefined;
  if (Array.isArray(primaryKey)) {
    if (typeof value !== 'object' || !value) return undefined;
    const out: Record<string, any> = {};
    for (const k of primaryKey) {
      const v = (value as any)[k];
      if (typeof v === 'undefined' || v === null) return undefined;
      out[k] = v;
    }
    return out;
  }
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'object') {
    return (value as any)[primaryKey];
  }
  return undefined;
}

/**
 * 创建一个用于“对象类变量”（如 formValues / item）的 `resolveOnServer` 判定函数。
 * 仅当访问路径以“关联字段名”开头（且继续访问其子属性）时，返回 true 交由服务端解析；
 * 否则在前端解析即可。
 *
 * @param collectionAccessor 返回当前对象所在 collection
 * @param valueAccessor 可选，本地值访问器。若本地已存在目标子路径的值，则认为无需走后端，优先使用本地值。
 * @returns `(subPath) => boolean` 判断是否需要服务端解析
 */
export function createAssociationSubpathResolver(
  collectionAccessor: () => Collection | null,
  valueAccessor?: () => unknown,
): (subPath: string) => boolean {
  return (p: string) => {
    // 仅在访问子属性时才考虑后端
    if (!p || !p.includes('.')) return false;
    const base = baseFieldNameOf(p);
    if (!base) return false;
    const collection = collectionAccessor();
    const field = findFieldByName(collection, base);
    const isAssoc = !!field?.isAssociationField();
    if (!isAssoc) return false;

    // 可选：本地优先。当提供 valueAccessor 时，若本地已有该子路径值，则不走后端
    if (typeof valueAccessor === 'function') {
      const local = valueAccessor();
      if (local && typeof local === 'object') {
        const v = _.get(local as Record<string, unknown>, p);
        if (typeof v !== 'undefined') return false;
      }
    }

    return true;
  };
}

/**
 * 构建“对象类变量”的 PropertyMetaFactory：
 * - 暴露集合字段结构（通过 createCollectionContextMeta）用于变量选择器；
 * - 提供 buildVariablesParams：基于对象当前值，收集所有“已选择的关联字段”
 *   以便服务端在 variables:resolve 时按需补全关联数据。
 *
 * @param collectionAccessor 获取集合对象，用于字段/元信息来源
 * @param title 变量组标题（用于 UI 展示）
 * @param valueAccessor 获取当前对象值（如 ctx.form.getFieldsValue() / ctx.item）
 * @returns PropertyMetaFactory
 */
export function createAssociationAwareObjectMetaFactory(
  collectionAccessor: () => Collection | null,
  title: string,
  valueAccessor: (ctx: FlowContext) => any,
): PropertyMetaFactory {
  const baseFactory = createCollectionContextMeta(collectionAccessor, title, true);
  const factory: PropertyMetaFactory = async () => {
    const base = (await baseFactory()) as PropertyMeta | null;
    if (!base) return null;

    const meta: PropertyMeta = {
      ...base,
      buildVariablesParams: (ctx: FlowContext) => {
        const collection = collectionAccessor();
        const obj = valueAccessor(ctx);
        if (!collection || !obj || typeof obj !== 'object') return {};
        const params: Record<string, any> = {};

        const fields: CollectionField[] = collection.getFields?.() || [];
        for (const field of fields) {
          const name = field.name as string | undefined;
          if (!name) continue;
          if (!field.isAssociationField()) continue;
          const target = field.target as string | undefined;
          const targetCollection = field.targetCollection;
          if (!target || !targetCollection) continue;
          const primaryKey = targetCollection.filterTargetKey as string | string[];

          const associationValue = (obj as any)[name];
          if (associationValue == null) continue;

          if (Array.isArray(associationValue)) {
            const ids = associationValue.map((item) => toFilterByTk(item, primaryKey)).filter((v) => v != null);
            if (ids.length) {
              params[name] = {
                collection: target,
                dataSourceKey: targetCollection.dataSourceKey,
                filterByTk: ids,
              };
            }
          } else {
            const id = toFilterByTk(associationValue, primaryKey);
            if (id != null) {
              params[name] = {
                collection: target,
                dataSourceKey: targetCollection.dataSourceKey,
                filterByTk: id,
              };
            }
          }
        }

        return params;
      },
    };

    return meta;
  };
  factory.title = title;
  return factory;
}
