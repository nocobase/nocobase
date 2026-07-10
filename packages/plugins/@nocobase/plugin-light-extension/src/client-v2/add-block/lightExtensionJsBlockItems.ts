/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';

import { NAMESPACE } from '../../constants';
import type { LightExtensionRepoRecord, LightExtensionSelectableEntryRecord } from '../../shared/types';
import { listLightExtensionRepos, listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getEntryLabel(entry: LightExtensionSelectableEntryRecord): string {
  return entry.title || entry.entryName || entry.id;
}

function getRepoLabel(repo: LightExtensionRepoRecord): string {
  return repo.title || repo.name || repo.id;
}

function toLightExtensionJSBlockItem(
  entry: LightExtensionSelectableEntryRecord,
  repoLabel: string,
  options: { label?: string } = {},
): SubModelItem | null {
  if (entry.kind !== 'js-block' || !entry.runtimeArtifact?.code) {
    return null;
  }

  return {
    key: `light-extension-js-block:${entry.id}`,
    label: options.label || getEntryLabel(entry),
    sort: entry.sort ?? 1000,
    createModelOptions: () => ({
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: entry.repoId,
              repoTitle: repoLabel,
              entryId: entry.id,
              entryTitle: getEntryLabel(entry),
              entryName: entry.entryName,
              entryPath: entry.entryPath,
              kind: 'js-block',
            },
            settings: extractSettingsDefaults(entry.settingsSchema),
            version: entry.runtimeVersion || entry.runtimeArtifact.version || 'v2',
          },
        },
      },
    }),
  };
}

export async function createLightExtensionJSBlockAddItems(ctx: FlowModelContext): Promise<SubModelItem[]> {
  try {
    const [entries, repos] = await Promise.all([
      listSelectableLightExtensionEntries(ctx.api, { kind: 'js-block' }),
      listLightExtensionRepos(ctx.api).catch(() => [] as LightExtensionRepoRecord[]),
    ]);
    const repoLabels = new Map(repos.map((repo) => [repo.id, getRepoLabel(repo)]));
    const entriesByRepo = entries
      .filter((entry) => entry.kind === 'js-block' && Boolean(entry.runtimeArtifact?.code))
      .reduce((groups, entry) => {
        const items = groups.get(entry.repoId);
        if (items) {
          items.push(entry);
        } else {
          groups.set(entry.repoId, [entry]);
        }
        return groups;
      }, new Map<string, LightExtensionSelectableEntryRecord[]>());
    const children = Array.from(entriesByRepo.entries())
      .map(([repoId, repoEntries]) => {
        const repoLabel = repoLabels.get(repoId) || repoId;
        if (repoEntries.length === 1) {
          return toLightExtensionJSBlockItem(repoEntries[0], repoLabel, { label: repoLabel });
        }

        return {
          key: `light-extension-js-block-repo:${repoId}`,
          type: 'group' as const,
          label: repoLabel,
          sort: Math.min(...repoEntries.map((entry) => entry.sort ?? 1000)),
          children: repoEntries
            .map((entry) => toLightExtensionJSBlockItem(entry, repoLabel))
            .filter((item): item is SubModelItem => Boolean(item)),
        };
      })
      .filter((item): item is SubModelItem => Boolean(item));

    if (children.length === 0) {
      return [];
    }

    return [
      {
        key: 'select-scene-light-extension-js-blocks',
        type: 'group',
        label: ctx.t('From light extension', { ns: NAMESPACE }),
        sort: 900,
        children,
      },
    ];
  } catch (error) {
    console.error('[NocoBase] Failed to load light extension JS block items:', error);
    return [];
  }
}

function extractSettingsDefaults(schema: Record<string, unknown> | null): Record<string, unknown> {
  if (!schema) {
    return {};
  }
  if (isRecord(schema.default)) {
    return cloneRecord(schema.default);
  }
  if (!isRecord(schema.properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (!isRecord(propertySchema)) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(propertySchema, 'default')) {
      defaults[key] = cloneJsonValue(propertySchema.default);
      continue;
    }
    const childDefaults = extractSettingsDefaults(propertySchema);
    if (Object.keys(childDefaults).length > 0) {
      defaults[key] = childDefaults;
    }
  }
  return defaults;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}
