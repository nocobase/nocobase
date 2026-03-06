/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type CapabilityCollection = {
  options?: Record<string, any>;
};

type CapabilityModelClass = {
  prototype?: {
    getAclActionName?: () => string | null | undefined;
  };
  capabilityActionName?: string | null;
  capabilityActionNames?: string[] | null;
  blockCapabilityActionName?: string | null;
  blockCapabilityActionNames?: string[] | null;
};

const VIEW_ACTION_ALIASES = {
  view: 'get',
} as const;

/**
 * 统一动作能力名，保证 v2 与 v1 使用同一套数据源动作键。
 *
 * @param actionName 动作名
 * @returns 归一化后的动作能力名
 */
export const normalizeCapabilityActionName = (actionName?: string | null) => {
  if (!actionName) {
    return null;
  }

  return VIEW_ACTION_ALIASES[actionName as keyof typeof VIEW_ACTION_ALIASES] || actionName;
};

/**
 * 从模型类中读取显式声明的动作能力键。
 *
 * @param ModelClass 模型类
 * @param keys 需要读取的静态字段名
 * @returns 动作能力键数组或 null
 */
const getExplicitCapabilityNames = (ModelClass: CapabilityModelClass, keys: string[]) => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(ModelClass, key)) {
      continue;
    }

    const value = (ModelClass as any)[key];
    if (value == null) {
      return null;
    }

    return (Array.isArray(value) ? value : [value]).map((item) => normalizeCapabilityActionName(item)).filter(Boolean);
  }

  return undefined;
};

/**
 * 判断 collection 是否支持指定动作能力。
 *
 * @param collection 数据表
 * @param capabilityName 动作能力键
 * @returns 是否支持
 */
export const isCapabilitySupported = (
  collection: CapabilityCollection | null | undefined,
  capabilityName?: string | null,
) => {
  const normalizedName = normalizeCapabilityActionName(capabilityName);
  if (!normalizedName || !collection?.options) {
    return true;
  }

  const { availableActions, unavailableActions } = collection.options;

  if (Array.isArray(availableActions)) {
    return availableActions.includes(normalizedName);
  }

  if (Array.isArray(unavailableActions)) {
    return !unavailableActions.includes(normalizedName);
  }

  return true;
};

/**
 * 判断 collection 是否支持一组动作能力。
 *
 * @param collection 数据表
 * @param capabilityNames 动作能力键数组
 * @returns 是否全部支持
 */
export const areCapabilitiesSupported = (
  collection: CapabilityCollection | null | undefined,
  capabilityNames?: Array<string | null | undefined> | null,
) => {
  if (!capabilityNames?.length) {
    return true;
  }

  return capabilityNames.every((capabilityName) => isCapabilitySupported(collection, capabilityName));
};

/**
 * 推导动作模型使用的数据源动作能力键。
 * 默认会回落到 getAclActionName，但允许通过静态字段显式覆写。
 *
 * @param ModelClass 动作模型类
 * @returns 动作能力键数组或 null
 */
export const getActionCapabilityNamesFromModelClass = (ModelClass: CapabilityModelClass) => {
  const explicit = getExplicitCapabilityNames(ModelClass, ['capabilityActionNames', 'capabilityActionName']);
  if (explicit !== undefined) {
    return explicit;
  }

  const getAclActionName = ModelClass?.prototype?.getAclActionName;
  if (typeof getAclActionName !== 'function') {
    return null;
  }

  try {
    const actionName = getAclActionName.call({});
    const normalizedName = normalizeCapabilityActionName(actionName);
    return normalizedName ? [normalizedName] : null;
  } catch {
    return null;
  }
};

/**
 * 推导区块模型在“选择 collection”时需要满足的数据源动作能力键。
 * 仅对显式声明的区块生效，避免误把所有区块都套上 view/create/update 过滤。
 *
 * @param ModelClass 区块模型类
 * @returns 动作能力键数组或 null
 */
export const getBlockCapabilityNamesFromModelClass = (ModelClass: CapabilityModelClass) => {
  const explicit = getExplicitCapabilityNames(ModelClass, ['blockCapabilityActionNames', 'blockCapabilityActionName']);
  return explicit ?? null;
};
