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
export const NB_IMAGE_REGISTRY_OPTIONS = ['dockerhub', 'aliyun'] as const;
export type NbImageRegistry = (typeof NB_IMAGE_REGISTRY_OPTIONS)[number];
export const DEFAULT_NB_IMAGE_REGISTRY: NbImageRegistry = 'dockerhub';
export const NB_IMAGE_VARIANT_OPTIONS = ['standard', 'no-nginx', 'full', 'full-no-nginx'] as const;
export type NbImageVariant = (typeof NB_IMAGE_VARIANT_OPTIONS)[number];
export const DEFAULT_NB_IMAGE_VARIANT: NbImageVariant = 'full';
export const DOCKER_IMAGE_FULL_SUFFIX = '-full';
export const DOCKER_IMAGE_NO_NGINX_SUFFIX = '-no-nginx';
export const DOCKER_IMAGE_FULL_NO_NGINX_SUFFIX = '-full-no-nginx';
export const DEFAULT_KINGBASE_IMAGE =
  'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86';

const OFFICIAL_DOCKER_REGISTRY_REPOSITORIES: Record<NbImageRegistry, string> = {
  dockerhub: DEFAULT_DOCKER_REGISTRY,
  aliyun: DEFAULT_DOCKER_REGISTRY_ZH_CN,
};

const DEFAULT_BUILTIN_DB_IMAGES: Record<string, string> = {
  postgres: 'postgres:16',
  mysql: 'mysql:8',
  mariadb: 'mariadb:11',
  kingbase: DEFAULT_KINGBASE_IMAGE,
};

const ALIYUN_BUILTIN_DB_IMAGES: Record<string, string> = {
  postgres: 'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
  mysql: 'registry.cn-shanghai.aliyuncs.com/nocobase/mysql:8',
  mariadb: 'registry.cn-shanghai.aliyuncs.com/nocobase/mariadb:11',
  kingbase: DEFAULT_KINGBASE_IMAGE,
};

const OFFICIAL_FULL_IMAGE_REGISTRIES = new Set([
  DEFAULT_DOCKER_REGISTRY,
  DEFAULT_DOCKER_REGISTRY_ZH_CN,
]);

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalizeNbImageRegistry(value: unknown): NbImageRegistry | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (NB_IMAGE_REGISTRY_OPTIONS as readonly string[]).includes(normalized)
    ? (normalized as NbImageRegistry)
    : undefined;
}

export function normalizeNbImageVariant(value: unknown): NbImageVariant | undefined {
  const normalized = trimValue(value);
  if (!normalized) {
    return undefined;
  }

  return (NB_IMAGE_VARIANT_OPTIONS as readonly string[]).includes(normalized)
    ? (normalized as NbImageVariant)
    : undefined;
}

export function resolveOfficialDockerRegistry(value?: unknown): string {
  const registry = normalizeNbImageRegistry(value) ?? DEFAULT_NB_IMAGE_REGISTRY;
  return OFFICIAL_DOCKER_REGISTRY_REPOSITORIES[registry];
}

export function inferNbImageRegistryFromRepository(value: unknown): NbImageRegistry | undefined {
  const repository = trimValue(value);
  return (Object.entries(OFFICIAL_DOCKER_REGISTRY_REPOSITORIES) as Array<[NbImageRegistry, string]>).find(
    ([, candidate]) => candidate === repository,
  )?.[0];
}

function hasKnownVariantSuffix(tag: string): boolean {
  return (
    tag.endsWith(DOCKER_IMAGE_FULL_NO_NGINX_SUFFIX) ||
    tag.endsWith(DOCKER_IMAGE_NO_NGINX_SUFFIX) ||
    tag.endsWith(DOCKER_IMAGE_FULL_SUFFIX)
  );
}

export function shouldUseFullDockerImageTag(registry: unknown): boolean {
  return OFFICIAL_FULL_IMAGE_REGISTRIES.has(trimValue(registry));
}

export function normalizeDockerImageTag(
  registry: unknown,
  version: unknown,
  options?: { variant?: NbImageVariant; defaultVariant?: NbImageVariant },
): string {
  const tag = trimValue(version) || DEFAULT_DOCKER_VERSION;
  if (hasKnownVariantSuffix(tag)) {
    return tag;
  }

  const explicitVariant = normalizeNbImageVariant(options?.variant) ?? normalizeNbImageVariant(options?.defaultVariant);
  const inferredVariant = shouldUseFullDockerImageTag(registry) ? DEFAULT_NB_IMAGE_VARIANT : 'standard';
  const variant = explicitVariant ?? inferredVariant;

  switch (variant) {
    case 'standard':
      return tag;
    case 'no-nginx':
      return `${tag}${DOCKER_IMAGE_NO_NGINX_SUFFIX}`;
    case 'full':
      return `${tag}${DOCKER_IMAGE_FULL_SUFFIX}`;
    case 'full-no-nginx':
      return `${tag}${DOCKER_IMAGE_FULL_NO_NGINX_SUFFIX}`;
  }
}

export function resolveDockerImageRef(
  registry: unknown,
  version: unknown,
  options?: {
    defaultRegistry?: string;
    defaultVersion?: string;
    variant?: NbImageVariant;
    defaultVariant?: NbImageVariant;
  },
): string {
  const resolvedRegistry = trimValue(registry) || options?.defaultRegistry || DEFAULT_DOCKER_REGISTRY;
  const rawVersion = trimValue(version) || options?.defaultVersion || DEFAULT_DOCKER_VERSION;
  const normalizedTag = normalizeDockerImageTag(resolvedRegistry, rawVersion, {
    variant: options?.variant,
    defaultVariant: options?.defaultVariant,
  });
  return `${resolvedRegistry}:${normalizedTag}`;
}

export function resolveBuiltinDbImage(dbDialect: unknown, options?: { registry?: NbImageRegistry | string }): string {
  const dialect = trimValue(dbDialect) || 'postgres';
  const configuredRegistry =
    normalizeNbImageRegistry(options?.registry) ??
    inferNbImageRegistryFromRepository(options?.registry) ??
    DEFAULT_NB_IMAGE_REGISTRY;
  const defaults = configuredRegistry === 'aliyun' ? ALIYUN_BUILTIN_DB_IMAGES : DEFAULT_BUILTIN_DB_IMAGES;
  return defaults[dialect] ?? defaults.postgres;
}
