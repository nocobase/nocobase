/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { FlowModel } from '../models';
import type { FlowModelContext } from '../flowContext';
import type { ModelConstructor } from '../types';
import { resolveCreateModelOptions } from './params-resolvers';
// ==================== 类型定义 ====================

interface MenuItemBase {
  key: string;
  label: string;
  icon?: string;
}

interface MenuItem extends MenuItemBase {
  createModelOptions?: (() => Promise<any>) | any;
  // 开关控制由 AddSubModelButton 基于 toggleable 动态构造
  toggleable?: boolean | ((model: FlowModel) => boolean);
  useModel?: string;
  children?: MenuItem[] | (() => Promise<MenuItem[]>);
}

// ==================== 子项处理函数 ====================

async function resolveMetaChildren(
  children: any[] | ((ctx: FlowModelContext) => any[] | Promise<any[]>) | undefined,
  ctx: FlowModelContext,
): Promise<any[]> {
  if (!children) return [];

  if (typeof children === 'function') {
    try {
      const result = await children(ctx);
      return result || [];
    } catch (error) {
      console.error('Error resolving meta children function:', error);
      return [];
    }
  }

  return children;
}

export async function processMetaChildren(
  children: any[] | ((ctx: FlowModelContext) => any[] | Promise<any[]>),
  ctx: FlowModelContext,
  keyPrefix = '',
): Promise<MenuItem[]> {
  const resolvedChildren = await resolveMetaChildren(children, ctx);
  const result: MenuItem[] = [];

  for (let i = 0; i < resolvedChildren.length; i++) {
    const child = resolvedChildren[i];
    const label = child?.label;
    const childKey = `${keyPrefix}${label || `item-${i}`}`;

    if (child.children) {
      const nestedChildren = await processMetaChildren(child.children, ctx, `${childKey}.`);
      result.push({
        key: childKey,
        label,
        icon: child.icon,
        children: nestedChildren,
      });
    } else {
      const optionsSource = child.createModelOptions;
      const defaultOptions = await resolveCreateModelOptions(optionsSource, ctx);
      result.push({
        key: childKey,
        label,
        icon: child.icon,
        createModelOptions: {
          ...defaultOptions,
          use:
            typeof defaultOptions?.use === 'string'
              ? defaultOptions.use
              : (defaultOptions?.use as any)?.name || childKey,
        },
        toggleable: child.toggleable,
        useModel: child.useModel,
      });
    }
  }

  return result;
}

// ==================== 字段菜单构建器 ====================

function checkFieldInStepParams(fieldName: string, subModel: FlowModel): boolean {
  const stepParams = subModel.stepParams;

  if (!stepParams || Object.keys(stepParams).length === 0) {
    return false;
  }

  for (const flowKey in stepParams) {
    const flowSteps = stepParams[flowKey];
    if (!flowSteps) continue;

    for (const stepKey in flowSteps) {
      const stepData = flowSteps[stepKey];
      if (stepData?.fieldPath === fieldName || stepData?.field === fieldName) {
        return true;
      }
    }
  }
  return false;
}

function getFieldModelClass(fieldInterface: string, fieldClasses: any[], defaultFieldClass: any) {
  return (
    fieldClasses.find((fieldClass) => {
      return fieldClass['supportedFieldInterfaces']?.includes(fieldInterface);
    }) || defaultFieldClass
  );
}

export function buildFieldItems(
  fields: any[],
  model: FlowModel,
  subModelBaseClass: string | ModelConstructor,
  subModelKey: string,
  buildCreateModelOptions: (options: any) => any,
) {
  const fieldClassesMap = model.flowEngine.filterModelClassByParent(subModelBaseClass);
  const fieldClasses = Array.from(fieldClassesMap.values())
    ?.filter((ModelClass) => !ModelClass.meta?.hide)
    ?.sort((a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0));

  if (fieldClasses.length === 0) {
    return [];
  }

  const fieldClassToNameMap = new Map();
  for (const [name, ModelClass] of fieldClassesMap) {
    fieldClassToNameMap.set(ModelClass, name);
  }

  const defaultFieldClass = fieldClasses.find((fieldClass) => fieldClass['supportedFieldInterfaces'] === '*');

  const allFields = fields
    .filter((field) => field.options?.interface)
    .map((field) => {
      const fieldInterfaceName = field.options.interface;
      const fieldClass = getFieldModelClass(fieldInterfaceName, fieldClasses, defaultFieldClass);

      if (!fieldClass) return null;

      const defaultOptions = {
        ...fieldClass.meta?.createModelOptions,
        use: fieldClassToNameMap.get(fieldClass) || fieldClass.name,
      };

      return {
        key: field.name,
        label: field.title,
        icon: fieldClass.meta?.icon,
        createModelOptions: buildCreateModelOptions({
          defaultOptions,
          collectionField: field,
          fieldPath: field.name,
          fieldModelClass: fieldClass,
        }),
        toggleable: (subModel) => checkFieldInStepParams(field.name, subModel),
        useModel: defaultOptions.use,
      };
    })
    .filter(Boolean);

  return [
    {
      key: 'addField',
      label: 'Collection fields',
      type: 'group' as const,
      searchable: true,
      searchPlaceholder: 'Search fields',
      children: allFields,
    },
  ];
}
