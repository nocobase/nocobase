/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '../flowEngine';
import { DATA_SOURCE_DIRTY_EVENT } from '../views/viewEvents';

type MarkDataSourceDirtyOptions = {
  engine?: FlowEngine;
  dataSourceKey?: unknown;
  resourceName?: unknown;
  includePreviousEngines?: boolean;
};

export function getHeaderValue(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const maybeHeaders = headers as { get?: (key: string) => unknown };
  if (typeof maybeHeaders.get === 'function') {
    const value = maybeHeaders.get(name);
    if (value != null && value !== '') {
      return value;
    }
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
}

export function getDataSourceKeyFromHeaders(headers: unknown): string {
  const value = getHeaderValue(headers, 'x-data-source');
  if (Array.isArray(value)) {
    return String(value[0] || 'main');
  }
  return value == null || value === '' ? 'main' : String(value);
}

export function getAffectedResourceNames(resourceName: unknown): string[] {
  const name = String(resourceName || '').trim();
  if (!name) {
    return [];
  }

  const names = new Set<string>([name]);
  if (name.includes('.')) {
    names.add(name.split('.')[0]);
  }
  return Array.from(names);
}

function getDirtyTargetEngines(engine: FlowEngine, includePreviousEngines?: boolean): FlowEngine[] {
  if (!includePreviousEngines) {
    return [engine];
  }

  const engines: FlowEngine[] = [];
  const seen = new Set<FlowEngine>();
  let current: FlowEngine | undefined = engine;
  let guard = 0;

  while (current && guard++ < 50) {
    if (!seen.has(current)) {
      engines.push(current);
      seen.add(current);
    }
    current = current.previousEngine;
  }

  return engines;
}

export function markDataSourceDirty(options: MarkDataSourceDirtyOptions): string[] {
  const { engine, resourceName, includePreviousEngines } = options;
  if (!engine?.markDataSourceDirty) {
    return [];
  }

  const resourceNames = getAffectedResourceNames(resourceName);
  if (!resourceNames.length) {
    return [];
  }

  const dataSourceKey = String(options.dataSourceKey || 'main');
  const targetEngines = getDirtyTargetEngines(engine, includePreviousEngines);
  const beforeVersions = new Map<FlowEngine, Map<string, number>>();

  for (const targetEngine of targetEngines) {
    const versions = new Map<string, number>();
    beforeVersions.set(targetEngine, versions);
    for (const name of resourceNames) {
      versions.set(name, targetEngine.getDataSourceDirtyVersion?.(dataSourceKey, name) || 0);
    }
  }

  for (const targetEngine of targetEngines) {
    const versions = beforeVersions.get(targetEngine);
    for (const name of resourceNames) {
      const before = versions?.get(name) || 0;
      const current = targetEngine.getDataSourceDirtyVersion?.(dataSourceKey, name) || 0;
      if (current !== before) {
        continue;
      }
      targetEngine.markDataSourceDirty(dataSourceKey, name);
    }
  }

  engine.emitter?.emit?.(DATA_SOURCE_DIRTY_EVENT, {
    dataSourceKey,
    resourceNames,
  });

  return resourceNames;
}
