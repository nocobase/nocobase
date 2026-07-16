/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import {
  DEFAULT_LIGHT_EXTENSION_README,
  DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES,
  createDefaultLightExtensionTemplate,
} from '../../shared/default-template';
import type { LightExtensionKind } from '../../shared/types';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

const EXPECTED_ENTRY_PATHS = [
  'src/client/js-blocks/welcome-card/index.tsx',
  'src/client/js-blocks/collection-summary/index.tsx',
  'src/client/js-blocks/collection-table/index.tsx',
  'src/client/js-actions/refresh-data/index.ts',
  'src/client/js-actions/confirm-action/index.ts',
  'src/client/js-fields/status-tag/index.tsx',
  'src/client/js-fields/editable-text/index.tsx',
  'src/client/js-fields/record-status-column/index.tsx',
  'src/client/js-fields/record-summary-column/index.tsx',
  'src/client/js-items/form-total-preview/index.tsx',
  'src/client/js-items/selection-tools/index.tsx',
  'src/client/runjs/calculate-subtotal/index.ts',
  'src/client/runjs/calculate-total-with-tax/index.ts',
] as const;

describe('plugin-light-extension default source template', () => {
  it('contains configurable examples for every supported surface and passes source validation', () => {
    const files = createDefaultLightExtensionTemplate();
    const paths = files.map((file) => file.path);
    const diagnostics = new LightExtensionValidator().validateInitialFiles({ files });

    expect(paths).toEqual([
      'README.md',
      'tsconfig.json',
      ...EXPECTED_ENTRY_PATHS.flatMap((path) => [path, path.replace(/\/index\.[^.]+$/u, '/entry.json')]),
    ]);
    expect(diagnostics).toEqual([]);
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-blocks/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-actions/<entry-name>/index.ts');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-fields/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-items/<entry-name>/index.tsx');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('JS Column');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/runjs/<entry-name>/index.ts');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('entry.json');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('stable technical identity');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('every property');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('independent settings menu');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('value-return RunJS entries');
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('never probe a Schema URL over the network');
    expect(paths.some((path) => path.endsWith('/meta.json') || path.endsWith('/settings.json'))).toBe(false);
    const descriptors = files
      .filter((file) => file.path.endsWith('/entry.json'))
      .map((file) => JSON.parse(file.content || '{}') as Record<string, unknown>);
    expect(new Set(descriptors.map((descriptor) => descriptor.key)).size).toBe(EXPECTED_ENTRY_PATHS.length);
    expect(
      descriptors.reduce<Record<string, number>>((counts, descriptor) => {
        const category = String(descriptor.category || '');
        counts[category] = (counts[category] || 0) + 1;
        return counts;
      }, {}),
    ).toMatchObject({
      'js-field': 2,
      'js-column': 2,
      'js-item': 2,
      runjs: 2,
    });
    for (const descriptor of descriptors) {
      expect(descriptor).toEqual(
        expect.objectContaining({
          schemaVersion: 1,
          key: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          settings: expect.any(Object),
        }),
      );
    }
    expect(
      files.filter((file) => file.path.endsWith('/index.tsx')).every((file) => file.language === 'typescript'),
    ).toBe(true);
    expect(files.filter((file) => file.path.endsWith('/entry.json')).every((file) => file.language === 'json')).toBe(
      true,
    );
    const collectionSummary = files.find((file) => file.path === 'src/client/js-blocks/collection-summary/index.tsx');
    expect(collectionSummary?.content).toContain("ctx.initResource('MultiRecordResource');");
    expect(collectionSummary?.content).toContain('const resource = ctx.resource;');
    const collectionSummaryDescriptor = files.find(
      (file) => file.path === 'src/client/js-blocks/collection-summary/entry.json',
    );
    expect(JSON.parse(collectionSummaryDescriptor?.content || '{}').settings.displayField).toMatchObject({
      'x-component': 'CollectionFieldSelect',
      'x-component-props': { collectionField: 'collectionName' },
    });
    const collectionTable = files.find((file) => file.path === 'src/client/js-blocks/collection-table/index.tsx');
    expect(collectionTable?.content).toContain("ctx.makeResource('MultiRecordResource')");
    expect(collectionTable?.content).toContain('} = ctx.libs.antd;');
    expect(collectionTable?.content).toContain('} = ctx.libs.antdIcons;');
    expect(collectionTable?.content).toContain('<Table');
    expect(collectionTable?.content).toContain('normalizeAntdSort(sorterValue, fieldMap, tableDataScope)');
    expect(collectionTable?.content).toContain(
      'components={configurable ? { header: { cell: HeaderCell } } : undefined}',
    );
    expect(collectionTable?.content).toContain('const HeaderCell = React.useMemo(() =>');
    expect(collectionTable?.content).toContain('onPointerDown={(pointerEvent) =>');
    expect(collectionTable?.content).toContain('onDrop={(dropEvent) =>');
    expect(collectionTable?.content).toContain('data-column-drag-handle={fieldName}');
    expect(collectionTable?.content).toContain('data-column-resize-handle={fieldName}');
    expect(collectionTable?.content).toContain('id: headerIdByField.get(column.field)');
    expect(collectionTable?.content).toContain("headerFieldById.get(toNonEmptyString(props.id) || '')");
    expect(collectionTable?.content).toContain('requestParams.appends = appends');
    expect(collectionTable?.content).toContain('requestParams.sort = requestSort');
    expect(collectionTable?.content).toContain('requestRevisionRef.current !== requestRevision');
    expect(collectionTable?.content).toContain('const hidesSortedColumn =');
    expect(collectionTable?.content).toContain(
      'column.field === fieldName ? { ...column, width: startWidth } : column',
    );
    expect(collectionTable?.content).toContain('(Array.isArray(value) && value.length === 0)');
    expect(collectionTable?.content).toContain("value.toLowerCase() === 'true'");
    expect(collectionTable?.content).toContain('sourceBinding.entryId');
    expect(collectionTable?.content).toContain('flowModel.saveStepParams()');
    expect(collectionTable?.content).toContain('const persistState = getPersistState();');
    expect(collectionTable?.content).toContain('!isCurrentPersistState(persistState)');
    expect(collectionTable?.content).toContain('const saveStableStepParams = async () =>');
    expect(collectionTable?.content).toContain('while (isFlowModelActive())');
    expect(collectionTable?.content?.match(/await flowModel\.saveStepParams\(\);/g)).toHaveLength(2);
    expect(collectionTable?.content).not.toContain('setTimeout(');
    expect(collectionTable?.content).not.toContain('Tabulator');
    expect(collectionTable?.content).not.toContain('tabulator-tables');
    expect(collectionTable?.content).not.toContain('ctx.loadCSS');
    expect(collectionTable?.content).not.toContain('ctx.importAsync');
    expect(collectionTable?.content).not.toContain("from 'tabulator-tables'");
    const collectionTableDescriptor = files.find(
      (file) => file.path === 'src/client/js-blocks/collection-table/entry.json',
    );
    const parsedCollectionTableDescriptor = JSON.parse(collectionTableDescriptor?.content || '{}');
    expect(parsedCollectionTableDescriptor.description).toContain('Ant Design table');
    expect(parsedCollectionTableDescriptor.tags).toEqual(['JS Block', 'Collection', 'Table', 'Ant Design']);
    const collectionTableSettings = parsedCollectionTableDescriptor.settings;
    expect(collectionTableSettings.collectionName).toMatchObject({
      'x-component': 'CollectionSelect',
      'x-component-props': { dataSourceField: 'dataSourceKey' },
    });
    expect(collectionTableSettings.collectionName.required).not.toBe(true);
    expect(collectionTableSettings.columns).toMatchObject({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          width: { type: 'integer' },
          visible: { type: 'boolean' },
          formatter: { type: 'string' },
        },
      },
    });
    expect(DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES).toHaveLength(28);
  });

  it('returns a fresh file array for each repository', () => {
    const first = createDefaultLightExtensionTemplate();
    const second = createDefaultLightExtensionTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_LIGHT_EXTENSION_README);
  });

  it('compiles every default example entry', async () => {
    const auditService = new LightExtensionAuditService({} as Database);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const bridge = new LightExtensionWorkspaceCompilerBridge(
      auditService,
      new LightExtensionPermissionService(auditService),
    );
    const cases: Array<{ kind: LightExtensionKind; entryPath: string }> = EXPECTED_ENTRY_PATHS.map((entryPath) => ({
      kind: getKindFromEntryPath(entryPath),
      entryPath,
    }));

    for (const item of cases) {
      const rootPath = item.entryPath.slice(0, item.entryPath.lastIndexOf('/'));
      const result = await bridge.compileEntry({
        repoId: 'ler_default',
        kind: item.kind,
        entryName: 'example',
        entryPath: item.entryPath,
        files: createDefaultLightExtensionTemplate().filter(
          (file) => file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/'),
        ),
      });

      expect(result.accepted, `${item.kind}:${item.entryPath}\n${JSON.stringify(result.diagnostics, null, 2)}`).toBe(
        true,
      );
      expect(result.diagnostics, `${item.kind}:${item.entryPath}`).toEqual([]);
    }
  });
});

function getKindFromEntryPath(entryPath: string): LightExtensionKind {
  if (entryPath.startsWith('src/client/js-blocks/')) return 'js-block';
  if (entryPath.startsWith('src/client/js-actions/')) return 'js-action';
  if (entryPath.startsWith('src/client/js-fields/')) return 'js-field';
  if (entryPath.startsWith('src/client/js-items/')) return 'js-item';
  return 'runjs';
}
