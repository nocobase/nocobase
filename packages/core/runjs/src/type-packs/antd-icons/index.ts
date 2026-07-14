/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../generator';

export interface RunJSAntdIconsCompletionCatalogEntry {
  name: string;
  category: 'component' | 'function' | 'icon' | 'object' | 'variable';
  packId: string;
  group?: string;
  source?: string;
}

export interface RunJSAntdIconsTypePackEntry {
  symbol: string;
  category: RunJSAntdIconsCompletionCatalogEntry['category'];
  group: string;
  packId: string;
  entry: string;
  exportName?: string;
}

export const RUNJS_ANTD_ICONS_BASE_PACK_ID = 'antd-icons/base';
export const RUNJS_ANTD_ICONS_FULL_PACK_ID = 'antd-icons/full';
export const RUNJS_TYPESCRIPT_ANTD_ICONS_BRIDGE_DIRECTORY = '/__runjs__/type-packs/antd-icons';
export const RUNJS_ANTD_ICONS_MAX_GROUP_COUNT = 27;
export const RUNJS_ANTD_ICONS_MAX_GROUP_SIZE = 128;
export const RUNJS_ANTD_ICONS_GROUP_NAMES = [
  ...Array.from({ length: 26 }, (_value, index) => String.fromCharCode(65 + index)),
  'other',
] as const;

export const RUNJS_ANTD_ICONS_NON_ICON_EXPORT_POLICY = {
  strategy: 'letter-group',
  exports: {
    createFromIconfontCN: '@ant-design/icons/lib/components/IconFont',
    getTwoToneColor: '@ant-design/icons/lib/components/twoTonePrimaryColor',
    IconProvider: '@ant-design/icons/lib/components/Context',
    setTwoToneColor: '@ant-design/icons/lib/components/twoTonePrimaryColor',
  },
  defaultExport: {
    packId: RUNJS_ANTD_ICONS_BASE_PACK_ID,
    entry: '@ant-design/icons/lib/components/Icon',
  },
} as const;

const baseEntry = '@ant-design/icons/lib/components/AntdIcon';
const helperEntries: Readonly<Record<string, { entry: string; exportName?: string }>> = {
  createFromIconfontCN: {
    entry: '@ant-design/icons/lib/components/IconFont',
    exportName: 'default',
  },
  getTwoToneColor: {
    entry: '@ant-design/icons/lib/components/twoTonePrimaryColor',
    exportName: 'getTwoToneColor',
  },
  IconProvider: {
    entry: '@ant-design/icons/lib/components/Context',
  },
  setTwoToneColor: {
    entry: '@ant-design/icons/lib/components/twoTonePrimaryColor',
    exportName: 'setTwoToneColor',
  },
};

export function getRunJSAntdIconGroup(symbol: string): string {
  const first = Array.from(symbol)[0] || '';
  return /^[A-Za-z]$/u.test(first) ? first.toUpperCase() : 'other';
}

export function createRunJSAntdIconsTypePackEntries(
  catalogEntries: readonly RunJSAntdIconsCompletionCatalogEntry[],
): RunJSAntdIconsTypePackEntry[] {
  const entries = new Map<string, RunJSAntdIconsTypePackEntry>();
  for (const catalogEntry of catalogEntries) {
    if (catalogEntry.source && catalogEntry.source !== '@ant-design/icons') {
      continue;
    }
    const symbol = normalizeSymbol(catalogEntry.name);
    const group = getRunJSAntdIconGroup(symbol);
    const packId = `antd-icons/${group}`;
    if (catalogEntry.group !== group || catalogEntry.packId !== packId) {
      throw new Error(
        `RunJS Ant Design Icons completion catalog pack mismatch for ${symbol}: expected ${packId}, received ${catalogEntry.packId}`,
      );
    }
    if (entries.has(symbol)) {
      throw new Error(`Duplicate RunJS Ant Design Icons completion catalog symbol: ${symbol}`);
    }
    const helper = helperEntries[symbol];
    if (catalogEntry.category !== 'icon' && !helper) {
      throw new Error(`Unsupported RunJS Ant Design Icons non-icon export: ${symbol}`);
    }
    entries.set(symbol, {
      symbol,
      category: catalogEntry.category,
      group,
      packId,
      entry: helper?.entry || baseEntry,
      exportName: helper?.exportName,
    });
  }
  return [...entries.values()].sort((left, right) => left.symbol.localeCompare(right.symbol));
}

export function createRunJSAntdIconsTypeLibraryPackDefinitions(
  catalogEntries: readonly RunJSAntdIconsCompletionCatalogEntry[],
): RunJSTypeLibraryPackDefinition[] {
  const entries = createRunJSAntdIconsTypePackEntries(catalogEntries);
  const groupedEntries = new Map<string, RunJSAntdIconsTypePackEntry[]>();
  for (const entry of entries) {
    const groupEntries = groupedEntries.get(entry.group) || [];
    groupEntries.push(entry);
    groupedEntries.set(entry.group, groupEntries);
  }
  validateGroups(groupedEntries);

  const groupDefinitions = [...groupedEntries.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, groupEntries]) => ({
      id: `antd-icons/${group}`,
      libraryName: 'antdIcons',
      entry: resolveGroupEntry(groupEntries),
      dependencies: [RUNJS_ANTD_ICONS_BASE_PACK_ID],
      rootFiles: [
        {
          path: `${RUNJS_TYPESCRIPT_ANTD_ICONS_BRIDGE_DIRECTORY}/${group.toLowerCase()}-bridge.d.ts`,
          content: createRunJSAntdIconsGroupBridgeDeclaration(groupEntries),
        },
      ],
      triggers: [`antd-icons/${group}`],
      metadata: {
        group,
        helperCount: groupEntries.filter((entry) => entry.category !== 'icon').length,
        iconCount: groupEntries.filter((entry) => entry.category === 'icon').length,
        symbolCount: groupEntries.length,
      },
    }));

  return [
    {
      id: RUNJS_ANTD_ICONS_BASE_PACK_ID,
      libraryName: 'antdIcons',
      entry: baseEntry,
      dependencies: ['react'],
      rootFiles: [
        {
          path: `${RUNJS_TYPESCRIPT_ANTD_ICONS_BRIDGE_DIRECTORY}/base-bridge.d.ts`,
          content: createRunJSAntdIconsBaseBridgeDeclaration(),
        },
      ],
      triggers: [RUNJS_ANTD_ICONS_BASE_PACK_ID],
      metadata: {
        groupCount: groupedEntries.size,
        maxGroupSize: Math.max(0, ...[...groupedEntries.values()].map((groupEntries) => groupEntries.length)),
        strategy: 'shared-base',
      },
    },
    ...groupDefinitions,
    {
      id: RUNJS_ANTD_ICONS_FULL_PACK_ID,
      libraryName: 'antdIcons',
      entry: '@ant-design/icons',
      dependencies: ['react'],
      rootFiles: [
        {
          path: `${RUNJS_TYPESCRIPT_ANTD_ICONS_BRIDGE_DIRECTORY}/full-bridge.d.ts`,
          content: createRunJSAntdIconsFullBridgeDeclaration(),
        },
      ],
      triggers: [RUNJS_ANTD_ICONS_FULL_PACK_ID],
      metadata: {
        fallback: true,
        strategy: 'full-module',
      },
    },
  ];
}

export function createRunJSAntdIconsBaseBridgeDeclaration(): string {
  return `
type RunJSAntdIconComponent = import('react').ForwardRefExoticComponent<
  Omit<import('@ant-design/icons/lib/components/AntdIcon').AntdIconProps, 'ref'> &
    import('react').RefAttributes<HTMLSpanElement>
>;
interface RunJSAntdIconsLibrary {
  readonly default: typeof import('@ant-design/icons/lib/components/Icon').default;
}
interface RunJSAntdIcons extends RunJSAntdIconsLibrary {}
`;
}

export function createRunJSAntdIconsGroupBridgeDeclaration(entries: readonly RunJSAntdIconsTypePackEntry[]): string {
  const properties = entries.map((entry) => `  readonly ${entry.symbol}: ${bridgeType(entry)};`).join('\n');
  return `
interface RunJSAntdIconsLibrary {
${properties}
}
interface RunJSAntdIcons extends RunJSAntdIconsLibrary {}
`;
}

export function createRunJSAntdIconsFullBridgeDeclaration(): string {
  return `
type RunJSOfficialAntdIconsModule = typeof import('@ant-design/icons');
interface RunJSAntdIconsLibrary extends RunJSOfficialAntdIconsModule {}
interface RunJSAntdIcons extends RunJSAntdIconsLibrary {}
`;
}

function bridgeType(entry: RunJSAntdIconsTypePackEntry): string {
  if (entry.category === 'icon') {
    return 'RunJSAntdIconComponent';
  }
  if (entry.symbol === 'IconProvider') {
    return `import('react').Provider<import('${entry.entry}').IconContextProps>`;
  }
  return `typeof import('${entry.entry}').${entry.exportName}`;
}

function resolveGroupEntry(entries: readonly RunJSAntdIconsTypePackEntry[]): string {
  return entries.find((entry) => entry.entry !== baseEntry)?.entry || baseEntry;
}

function validateGroups(groups: ReadonlyMap<string, readonly RunJSAntdIconsTypePackEntry[]>): void {
  if (groups.size > RUNJS_ANTD_ICONS_MAX_GROUP_COUNT) {
    throw new Error(
      `RunJS Ant Design Icons group count ${groups.size} exceeds the limit ${RUNJS_ANTD_ICONS_MAX_GROUP_COUNT}`,
    );
  }
  for (const [group, entries] of groups) {
    if (!RUNJS_ANTD_ICONS_GROUP_NAMES.includes(group as (typeof RUNJS_ANTD_ICONS_GROUP_NAMES)[number])) {
      throw new Error(`Invalid RunJS Ant Design Icons group: ${group}`);
    }
    if (entries.length > RUNJS_ANTD_ICONS_MAX_GROUP_SIZE) {
      throw new Error(
        `RunJS Ant Design Icons group ${group} size ${entries.length} exceeds the limit ${RUNJS_ANTD_ICONS_MAX_GROUP_SIZE}`,
      );
    }
  }
}

function normalizeSymbol(value: string): string {
  const symbol = String(value || '').trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(symbol)) {
    throw new Error(`Invalid RunJS Ant Design Icons completion catalog symbol: ${value}`);
  }
  return symbol;
}
