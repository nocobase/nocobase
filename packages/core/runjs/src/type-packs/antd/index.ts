/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../generator';

export interface RunJSAntdCompletionCatalogEntry {
  name: string;
  category: 'component' | 'function' | 'icon' | 'object' | 'variable';
  packId: string;
  source?: string;
}

export interface RunJSAntdTypePackEntry {
  symbol: string;
  category: RunJSAntdCompletionCatalogEntry['category'];
  entry: string;
  exportName: string;
  packId: string;
}

export const RUNJS_TYPESCRIPT_ANTD_BRIDGE_DIRECTORY = '/__runjs__/type-packs/antd';
export const RUNJS_ANTD_FULL_PACK_ID = 'antd/full';

export const RUNJS_ANTD_NON_COMPONENT_TYPE_POLICY = {
  strategy: 'symbol-pack',
  symbols: ['message', 'notification', 'theme', 'version', 'unstableSetRender'] as const,
  description:
    'Each public imperative API, hook namespace, variable, or function uses the same symbol-level pack strategy as components. Component values such as Modal retain their official static members through the default export type.',
} as const;

const dayjsBackedSymbols = new Set(['Calendar', 'DatePicker', 'TimePicker']);
const namedExportEntries: Readonly<Record<string, { entry: string; exportName: string }>> = {
  unstableSetRender: {
    entry: 'antd/es/config-provider/UnstableContext',
    exportName: 'unstableSetRender',
  },
};

export function createRunJSAntdTypePackEntries(
  catalogEntries: readonly RunJSAntdCompletionCatalogEntry[],
): RunJSAntdTypePackEntry[] {
  const entries = new Map<string, RunJSAntdTypePackEntry>();
  for (const catalogEntry of catalogEntries) {
    if (catalogEntry.source && catalogEntry.source !== 'antd') {
      continue;
    }
    const symbol = normalizeSymbol(catalogEntry.name);
    const expectedPackId = `antd/${symbol}`;
    if (catalogEntry.packId !== expectedPackId) {
      throw new Error(
        `RunJS Ant Design completion catalog pack mismatch for ${symbol}: expected ${expectedPackId}, received ${catalogEntry.packId}`,
      );
    }
    if (entries.has(symbol)) {
      throw new Error(`Duplicate RunJS Ant Design completion catalog symbol: ${symbol}`);
    }
    const namedExport = namedExportEntries[symbol];
    entries.set(symbol, {
      symbol,
      category: catalogEntry.category,
      entry: namedExport?.entry || `antd/es/${toKebabCase(symbol)}`,
      exportName: namedExport?.exportName || 'default',
      packId: expectedPackId,
    });
  }
  return [...entries.values()].sort((left, right) => left.symbol.localeCompare(right.symbol));
}

export function createRunJSAntdTypeLibraryPackDefinitions(
  catalogEntries: readonly RunJSAntdCompletionCatalogEntry[],
): RunJSTypeLibraryPackDefinition[] {
  const symbolDefinitions = createRunJSAntdTypePackEntries(catalogEntries).map((entry) => ({
    id: entry.packId,
    libraryName: 'antd',
    entry: entry.entry,
    dependencies: dayjsBackedSymbols.has(entry.symbol) ? ['react', 'dayjs'] : ['react'],
    rootFiles: [
      {
        path: `${RUNJS_TYPESCRIPT_ANTD_BRIDGE_DIRECTORY}/${toKebabCase(entry.symbol)}-bridge.d.ts`,
        content: createRunJSAntdBridgeDeclaration(entry),
      },
    ],
    triggers: [entry.packId],
    metadata: {
      category: entry.category,
      exportName: entry.exportName,
      requiresDOMTypeBridge: true,
      symbol: entry.symbol,
    },
  }));

  return [
    ...symbolDefinitions,
    {
      id: RUNJS_ANTD_FULL_PACK_ID,
      libraryName: 'antd',
      entry: 'antd',
      dependencies: ['react', 'dayjs'],
      rootFiles: [
        {
          path: `${RUNJS_TYPESCRIPT_ANTD_BRIDGE_DIRECTORY}/full-bridge.d.ts`,
          content: createRunJSAntdFullBridgeDeclaration(),
        },
      ],
      triggers: [RUNJS_ANTD_FULL_PACK_ID],
      metadata: {
        fallback: true,
        requiresDOMTypeBridge: true,
        strategy: 'full-module',
      },
    },
  ];
}

export function createRunJSAntdBridgeDeclaration(entry: RunJSAntdTypePackEntry): string {
  const exportAccess = entry.exportName === 'default' ? 'default' : entry.exportName;
  return `
interface RunJSAntdLibrary {
  readonly ${entry.symbol}: typeof import('${entry.entry}').${exportAccess};
}
interface RunJSAntd extends RunJSAntdLibrary {}
`;
}

export function createRunJSAntdFullBridgeDeclaration(): string {
  return `
type RunJSOfficialAntdModule = typeof import('antd');
interface RunJSAntdLibrary extends RunJSOfficialAntdModule {}
interface RunJSAntd extends RunJSAntdLibrary {}
`;
}

function normalizeSymbol(value: string): string {
  const symbol = String(value || '').trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(symbol)) {
    throw new Error(`Invalid RunJS Ant Design completion catalog symbol: ${value}`);
  }
  return symbol;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .toLowerCase();
}
