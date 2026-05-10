/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const DEFAULT_DOCKER_REGISTRY = 'nocobase/nocobase';
export const DEFAULT_DOCKER_REGISTRY_ZH_CN = 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase';
export const DEFAULT_DOCKER_VERSION = 'alpha';
export const DOCKER_IMAGE_FULL_SUFFIX = '-full';

const OFFICIAL_FULL_IMAGE_REGISTRIES = new Set([
  DEFAULT_DOCKER_REGISTRY,
  DEFAULT_DOCKER_REGISTRY_ZH_CN,
]);

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function shouldUseFullDockerImageTag(registry: unknown): boolean {
  return OFFICIAL_FULL_IMAGE_REGISTRIES.has(trimValue(registry));
}

export function normalizeDockerImageTag(registry: unknown, version: unknown): string {
  const tag = trimValue(version) || DEFAULT_DOCKER_VERSION;
  if (!shouldUseFullDockerImageTag(registry)) {
    return tag;
  }
  return tag.endsWith(DOCKER_IMAGE_FULL_SUFFIX)
    ? tag
    : `${tag}${DOCKER_IMAGE_FULL_SUFFIX}`;
}

export function resolveDockerImageRef(
  registry: unknown,
  version: unknown,
  options?: { defaultRegistry?: string; defaultVersion?: string },
): string {
  const resolvedRegistry = trimValue(registry) || options?.defaultRegistry || DEFAULT_DOCKER_REGISTRY;
  const rawVersion = trimValue(version) || options?.defaultVersion || DEFAULT_DOCKER_VERSION;
  const normalizedTag = normalizeDockerImageTag(resolvedRegistry, rawVersion);
  return `${resolvedRegistry}:${normalizedTag}`;
}
