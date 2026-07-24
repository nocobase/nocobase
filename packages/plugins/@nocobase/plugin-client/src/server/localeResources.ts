/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function parseLocaleResourceNamespaces(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function filterLocaleResources<T extends { resources?: Record<string, unknown> }>(
  payload: T,
  namespaceQuery: unknown,
): T {
  const namespaces = parseLocaleResourceNamespaces(namespaceQuery);
  if (!namespaces.length) return payload;

  const resources = payload.resources || {};
  return {
    ...payload,
    resources: Object.fromEntries(
      namespaces
        .filter((namespace) => Object.prototype.hasOwnProperty.call(resources, namespace))
        .map((namespace) => [namespace, resources[namespace]]),
    ),
  };
}
