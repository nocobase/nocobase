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
import type { LightExtensionPublicationMetadataRecord, LightExtensionSelectableEntryRecord } from '../../shared/types';
import { listSelectableLightExtensionEntries } from '../api/lightExtensionEntriesRequests';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneSettingsDefaults(publication: LightExtensionPublicationMetadataRecord): Record<string, unknown> {
  if (!isRecord(publication.settingsDefaultsSnapshot)) {
    return {};
  }

  return JSON.parse(JSON.stringify(publication.settingsDefaultsSnapshot)) as Record<string, unknown>;
}

function getEntryLabel(entry: LightExtensionSelectableEntryRecord): string {
  return entry.title || entry.entryName || entry.id;
}

function toLightExtensionJSBlockItem(entry: LightExtensionSelectableEntryRecord): SubModelItem | null {
  if (entry.kind !== 'js-block' || !entry.activePublicationId || !entry.activePublication) {
    return null;
  }

  const publication = entry.activePublication;

  return {
    key: `light-extension-js-block:${entry.id}:${publication.id}`,
    label: getEntryLabel(entry),
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
              repoTitle: entry.repoId,
              entryId: entry.id,
              entryTitle: getEntryLabel(entry),
              entryName: entry.entryName,
              kind: 'js-block',
              publicationId: publication.id,
              versionPolicy: 'follow-active',
            },
            settings: cloneSettingsDefaults(publication),
            version: publication.runtimeVersion || publication.artifact?.version || 'v2',
          },
        },
      },
    }),
  };
}

export async function createLightExtensionJSBlockAddItems(ctx: FlowModelContext): Promise<SubModelItem[]> {
  try {
    const entries = await listSelectableLightExtensionEntries(ctx.api, { kind: 'js-block' });
    const children = entries
      .map((entry) => toLightExtensionJSBlockItem(entry))
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
