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

import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';
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

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;
type TestElement = {
  props: Record<string, unknown>;
  type: unknown;
};

const asyncFunctionConstructor = Object.getPrototypeOf(async function runDefaultTemplateArtifactTest() {})
  .constructor as AsyncFunctionConstructor;

const EXPECTED_ENTRY_PATHS = [
  'src/client/js-pages/hello-page/index.tsx',
  'src/client/js-blocks/welcome-card/index.tsx',
  'src/client/js-blocks/collection-summary/index.tsx',
  'src/client/js-blocks/collection-table/index.tsx',
  'src/client/js-blocks/create-form/index.tsx',
  'src/client/js-blocks/edit-form/index.tsx',
  'src/client/js-blocks/details/index.tsx',
  'src/client/js-blocks/collection-list/index.tsx',
  'src/client/js-blocks/collection-grid-card/index.tsx',
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
const HELLO_PAGE_ENTRY_PATH = 'src/client/js-pages/hello-page/index.tsx';
const COLLECTION_TABLE_ENTRY_PATH = 'src/client/js-blocks/collection-table/index.tsx';
const COLLECTION_TABLE_SUPPORT_PATHS = [
  'src/client/js-blocks/collection-table/types.ts',
  'src/client/js-blocks/collection-table/table-utils.ts',
  'src/client/js-blocks/collection-table/TableCell.tsx',
  'src/client/js-blocks/collection-table/column-interactions.ts',
  'src/client/js-blocks/collection-table/ColumnHeaderCell.tsx',
  'src/client/js-blocks/collection-table/persistence.ts',
  'src/client/js-blocks/collection-table/useCollectionTableData.ts',
  'src/client/js-blocks/collection-table/CollectionTable.tsx',
] as const;
const COLLECTION_BLOCK_COMMON_PATHS = [
  'src/shared/collection-block/types.ts',
  'src/shared/collection-block/collection-utils.ts',
  'src/shared/collection-block/settings-persistence.ts',
  'src/shared/collection-block/FieldManager.tsx',
  'src/shared/collection-block/DisplayValue.tsx',
  'src/shared/collection-block/FormField.tsx',
  'src/shared/collection-block/useCollectionRecords.ts',
] as const;
const CREATE_FORM_ENTRY_PATH = 'src/client/js-blocks/create-form/index.tsx';
const EDIT_FORM_ENTRY_PATH = 'src/client/js-blocks/edit-form/index.tsx';
const DETAILS_ENTRY_PATH = 'src/client/js-blocks/details/index.tsx';
const COLLECTION_LIST_ENTRY_PATH = 'src/client/js-blocks/collection-list/index.tsx';
const COLLECTION_GRID_CARD_ENTRY_PATH = 'src/client/js-blocks/collection-grid-card/index.tsx';
const ENTRY_SUPPORT_PATHS: Record<string, readonly string[]> = {
  [COLLECTION_TABLE_ENTRY_PATH]: COLLECTION_TABLE_SUPPORT_PATHS,
  [CREATE_FORM_ENTRY_PATH]: ['src/client/js-blocks/create-form/CreateForm.tsx'],
  [EDIT_FORM_ENTRY_PATH]: ['src/client/js-blocks/edit-form/EditForm.tsx'],
  [DETAILS_ENTRY_PATH]: ['src/client/js-blocks/details/DetailsBlock.tsx'],
  [COLLECTION_LIST_ENTRY_PATH]: [
    'src/client/js-blocks/collection-list/ListRecord.tsx',
    'src/client/js-blocks/collection-list/CollectionList.tsx',
  ],
  [COLLECTION_GRID_CARD_ENTRY_PATH]: [
    'src/client/js-blocks/collection-grid-card/GridCardRecord.tsx',
    'src/client/js-blocks/collection-grid-card/CollectionGridCard.tsx',
  ],
};

describe('plugin-light-extension default source template', () => {
  it('contains configurable examples for every supported surface and passes source validation', () => {
    const files = createDefaultLightExtensionTemplate();
    const paths = files.map((file) => file.path);
    const diagnostics = new LightExtensionValidator().validateInitialFiles({ files });
    const expectedTemplatePaths = [
      'README.md',
      'tsconfig.json',
      ...EXPECTED_ENTRY_PATHS.flatMap((path) => {
        const descriptorPath = path.replace(/\/index\.[^.]+$/u, '/entry.json');
        const entryPaths = [path, ...(ENTRY_SUPPORT_PATHS[path] || []), descriptorPath];
        return path === COLLECTION_TABLE_ENTRY_PATH ? [...entryPaths, ...COLLECTION_BLOCK_COMMON_PATHS] : entryPaths;
      }),
    ];

    expect(paths).toEqual(expectedTemplatePaths);
    expect(diagnostics).toEqual([]);
    expect(DEFAULT_LIGHT_EXTENSION_README).toContain('src/client/js-pages/<entry-name>/index.tsx');
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
      'js-page': 1,
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
    const helloPage = files.find((file) => file.path === HELLO_PAGE_ENTRY_PATH);
    const helloPageSource = helloPage?.content || '';
    expect(helloPageSource).toContain(
      "import type { JSPageContext, RunJSContext } from '@nocobase/light-extension-sdk/client';",
    );
    expect(helloPageSource).toContain(
      "import type { Settings } from 'light-extension:settings/client/js-page/hello-page';",
    );
    expect(helloPageSource).toContain('RunJSContext & JSPageContext<Settings>');
    expect(helloPageSource).toContain('ctx.libs.antd');
    expect(helloPageSource).toContain('const settings = ctx.settings;');
    expect(helloPageSource).toContain('await ctx.page.refresh();');
    expect(helloPageSource).toContain('ctx.render(');
    expect(helloPageSource).toContain("ctx.t('Refresh page')");
    expect(helloPageSource).not.toMatch(/\b(?:any|Application|FlowModel|definePage|route|router)\b/u);
    const helloPageDescriptor = JSON.parse(
      files.find((file) => file.path === 'src/client/js-pages/hello-page/entry.json')?.content || '{}',
    ) as Record<string, unknown>;
    expect(helloPageDescriptor).toMatchObject({
      category: 'js-page',
      key: 'hello-page',
      settings: {
        title: { default: 'Hello from a JS Page', required: true, type: 'string' },
        showDetails: { default: true, type: 'boolean' },
        details: {
          default: 'This page is rendered by a light extension.',
          type: 'string',
          'x-visible-when': { operator: '$eq', path: 'showDetails', value: true },
        },
      },
    });
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
    const collectionTable = files.find((file) => file.path === COLLECTION_TABLE_ENTRY_PATH);
    const collectionTableFiles = files.filter(
      (file) => file.path.startsWith('src/client/js-blocks/collection-table/') && !file.path.endsWith('/entry.json'),
    );
    const collectionTableComponent = collectionTableFiles.find((file) => file.path.endsWith('/CollectionTable.tsx'));
    const collectionTableComponentSource = collectionTableComponent?.content || '';
    const collectionTableSource = collectionTableFiles.map((file) => file.content || '').join('\n');
    expect(collectionTable?.content).toBe(
      [
        "import { mountCollectionTable } from './CollectionTable';",
        '',
        'const { Alert } = ctx.libs.antd;',
        'ctx.render(<Alert type="info" showIcon message={ctx.t(\'Loading table\')} />);',
        'await mountCollectionTable();',
        '',
      ].join('\n'),
    );
    expect(collectionTableFiles.map((file) => file.path)).toEqual([
      COLLECTION_TABLE_ENTRY_PATH,
      ...COLLECTION_TABLE_SUPPORT_PATHS,
    ]);
    expect(collectionTableSource).toContain("ctx.makeResource('MultiRecordResource')");
    expect(collectionTableSource).toContain('} = ctx.libs.antd;');
    expect(collectionTableSource).toContain('} = ctx.libs.antdIcons;');
    expect(collectionTableSource).toContain('<Table');
    expect(collectionTableSource).toContain('normalizeAntdSort(sorterValue, fieldMap, tableDataScope)');
    expect(collectionTableSource).toContain('const settings = ctx.settings;');
    expect(collectionTableSource).not.toContain('isRecord(ctx.settings) ? ctx.settings : {}');
    expect(collectionTableSource).toContain('components={configurable ? { header: { cell: HeaderCell } } : undefined}');
    expect(collectionTableSource).toContain("import { createColumnHeaderCell } from './ColumnHeaderCell';");
    expect(collectionTableSource).toContain("import { createColumnInteractions } from './column-interactions';");
    expect(collectionTableSource).toContain("import { createTableCellRenderer } from './TableCell';");
    expect(collectionTableSource).toContain("import { useCollectionTableData } from './useCollectionTableData';");
    expect(collectionTableSource).toContain('const HeaderCell = React.useMemo(');
    expect(collectionTableComponentSource.split('\n').length).toBeLessThan(500);
    expect(collectionTableComponentSource.indexOf('const React = ctx.libs.React;')).toBeGreaterThan(
      collectionTableComponentSource.indexOf('async function runCollectionTable()'),
    );
    expect(collectionTableSource).toContain('onPointerDown={(pointerEvent) =>');
    expect(collectionTableSource).toContain('onDrop={(dropEvent) =>');
    expect(collectionTableSource).toContain('data-column-drag-handle={fieldName}');
    expect(collectionTableSource).toContain('data-column-resize-handle={fieldName}');
    expect(collectionTableSource).toContain('id: headerIdByField.get(column.field)');
    expect(collectionTableSource).toContain("headerFieldById.get(toNonEmptyString(props.id) || '')");
    expect(collectionTableSource).toContain('requestParams.appends = appends');
    expect(collectionTableSource).toContain('requestParams.sort = requestSort');
    expect(collectionTableSource).toContain('requestRevisionRef.current !== requestRevision');
    expect(collectionTableSource).toContain('const hidesSortedColumn =');
    expect(collectionTableSource).toContain('column.field === fieldName ? { ...column, width: startWidth } : column');
    expect(collectionTableSource).toContain('(Array.isArray(value) && value.length === 0)');
    expect(collectionTableSource).toContain("value.toLowerCase() === 'true'");
    expect(collectionTableSource).toContain('!interfaceName ||');
    expect(collectionTableSource).toContain('sourceBinding.entryId');
    expect(collectionTableSource).toContain('flowModel.saveStepParams()');
    expect(collectionTableSource).toContain('const persistState = getPersistState();');
    expect(collectionTableSource).toContain('!isCurrentPersistState(persistState)');
    expect(collectionTableSource).toContain('const saveStableStepParams = async () =>');
    expect(collectionTableSource).toContain('while (isFlowModelActive())');
    expect(collectionTableSource.match(/await flowModel\.saveStepParams\(\);/g)).toHaveLength(2);
    expect(collectionTableSource).toContain("ctx.t('Refresh')");
    expect(collectionTableSource).not.toContain("ctx.t('Reload')");
    expect(collectionTableSource).toContain(
      "flowModel.setTitle(collectionName ? ctx.t('JS Table') + ': ' + collectionName : ctx.t('JS Table'));",
    );
    expect(collectionTableSource).not.toContain('getRowKey = (record: JsonRecord, index?: number)');
    expect(collectionTableSource).not.toContain("settings.title || 'Collection table'");
    expect(collectionTableSource).not.toContain('setTimeout(');
    expect(collectionTableSource).not.toContain('Tabulator');
    expect(collectionTableSource).not.toContain('tabulator-tables');
    expect(collectionTableSource).not.toContain('ctx.loadCSS');
    expect(collectionTableSource).not.toContain('ctx.importAsync');
    expect(collectionTableSource).not.toContain("from 'tabulator-tables'");
    const collectionTableDescriptor = files.find(
      (file) => file.path === 'src/client/js-blocks/collection-table/entry.json',
    );
    const parsedCollectionTableDescriptor = JSON.parse(collectionTableDescriptor?.content || '{}');
    expect(parsedCollectionTableDescriptor.title).toBe('Table');
    expect(parsedCollectionTableDescriptor.description).toContain('Ant Design table');
    expect(parsedCollectionTableDescriptor.tags).toEqual(['JS Block', 'Collection', 'Table', 'Ant Design']);
    const collectionTableSettings = parsedCollectionTableDescriptor.settings;
    expect(collectionTableSettings.title.default).toBe('');
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
    expect(DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES).toHaveLength(expectedTemplatePaths.length);
  });

  it('returns a fresh file array for each repository', () => {
    const first = createDefaultLightExtensionTemplate();
    const second = createDefaultLightExtensionTemplate();

    first[0].content = '# Changed\n';
    expect(second[0].content).toBe(DEFAULT_LIGHT_EXTENSION_README);
  });

  it('keeps the JS Page example locale keys in parity', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());
    expect(enUS['Hello from a JS Page']).toBe('Hello from a JS Page');
    expect(zhCN['Hello from a JS Page']).toBe('来自 JS 页面的问候');
    expect(enUS['Refresh page']).toBe('Refresh page');
    expect(zhCN['Refresh page']).toBe('刷新页面');
    expect(enUS['This page is rendered by a light extension.']).toBe('This page is rendered by a light extension.');
    expect(zhCN['This page is rendered by a light extension.']).toBe('此页面由轻插件渲染。');
  });

  it('compiles every default example entry and exercises the collection block runtimes', async () => {
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
      const runtimeExpectation = getEntryRuntimeExpectation(item.entryPath);
      if (runtimeExpectation) {
        const artifactCode = result.artifact?.code;
        expect(artifactCode).toEqual(expect.any(String));
        if (typeof artifactCode === 'string') await runtimeExpectation(artifactCode);
      }
    }
  });
});

function getKindFromEntryPath(entryPath: string): LightExtensionKind {
  if (entryPath.startsWith('src/client/js-pages/')) return 'js-page';
  if (entryPath.startsWith('src/client/js-blocks/')) return 'js-block';
  if (entryPath.startsWith('src/client/js-actions/')) return 'js-action';
  if (entryPath.startsWith('src/client/js-fields/')) return 'js-field';
  if (entryPath.startsWith('src/client/js-items/')) return 'js-item';
  return 'runjs';
}

async function executeArtifact(code: string, ctx: unknown): Promise<unknown> {
  return new asyncFunctionConstructor('ctx', code)(ctx);
}

function getEntryRuntimeExpectation(entryPath: string): ((code: string) => Promise<void>) | undefined {
  switch (entryPath) {
    case COLLECTION_TABLE_ENTRY_PATH:
      return expectCollectionTableRuntime;
    case CREATE_FORM_ENTRY_PATH:
      return expectCreateFormRuntime;
    case EDIT_FORM_ENTRY_PATH:
      return expectEditFormRuntime;
    case DETAILS_ENTRY_PATH:
      return expectDetailsRuntime;
    case COLLECTION_LIST_ENTRY_PATH:
      return expectCollectionListRuntime;
    case COLLECTION_GRID_CARD_ENTRY_PATH:
      return expectCollectionGridCardRuntime;
    default:
      return undefined;
  }
}

function isTestElement(value: unknown): value is TestElement {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return 'type' in record && Boolean(record.props) && typeof record.props === 'object' && !Array.isArray(record.props);
}

function findElements(value: unknown, type: unknown, output: TestElement[] = []): TestElement[] {
  if (Array.isArray(value)) {
    value.forEach((item) => findElements(item, type, output));
    return output;
  }
  if (!isTestElement(value)) return output;
  if (value.type === type) output.push(value);
  findElements(value.props.children, type, output);
  findElements(value.props.content, type, output);
  return output;
}

function readElementText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(readElementText).join('');
  return isTestElement(value) ? readElementText(value.props.children) : '';
}

function createCollectionTableRuntime(settings: Record<string, unknown>) {
  const effects: Array<() => unknown> = [];
  const rendered: unknown[] = [];
  const React = {
    Fragment: 'Fragment',
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => {
      const nextProps = props && typeof props === 'object' ? { ...(props as Record<string, unknown>) } : {};
      if (children.length) nextProps.children = children.length === 1 ? children[0] : children;
      return typeof type === 'function'
        ? (type as (componentProps: Record<string, unknown>) => unknown)(nextProps)
        : { props: nextProps, type };
    },
    useEffect: (effect: () => unknown, _dependencies: unknown[]) => effects.push(effect),
    useMemo: <T>(factory: () => T) => factory(),
    useRef: <T>(initialValue: T) => ({ current: initialValue }),
    useState: <T>(initialValue: T | (() => T)) => {
      const value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      return [value, (_nextValue: T) => undefined] as const;
    },
  };
  const antd = {
    Alert: 'Alert',
    Button: 'Button',
    Checkbox: 'Checkbox',
    Popover: 'Popover',
    Select: 'Select',
    Space: 'Space',
    Table: 'Table',
    Tag: 'Tag',
    Tooltip: 'Tooltip',
    Typography: {
      Text: 'Typography.Text',
      Title: 'Typography.Title',
    },
    theme: {
      useToken: () => ({ token: { colorTextQuaternary: '#8c8c8c', marginSM: 8 } }),
    },
  };
  const runAction = vi.fn(async (_action: string, _options: Record<string, unknown>) => ({
    data: [],
    meta: { count: 0, page: 1 },
  }));
  const resource = {
    runAction,
    setDataSourceKey: (_key: string) => resource,
    setResourceName: (_name: string) => resource,
  };
  const runJs = {
    settings,
    sourceBinding: { entryId: 'lee_collection_table', kind: 'js-block', repoId: 'ler_default', type: 'entry' },
    sourceMode: 'light-extension',
  };
  const setTitle = vi.fn();
  type FakeFlowModel = {
    flowEngine: { getModel: (uid: string) => unknown };
    getStepParams: (flowKey: string, stepKey: string) => unknown;
    saveStepParams: () => Promise<unknown>;
    setTitle: (title: string) => void;
    setStepParams: (flowKey: string, stepKey: string, params: Record<string, unknown>) => void;
    uid: string;
  };
  const flowModel: FakeFlowModel = {
    flowEngine: { getModel: () => flowModel },
    getStepParams: () => runJs,
    saveStepParams: async () => undefined,
    setTitle,
    setStepParams: () => undefined,
    uid: 'collection-table-model',
  };
  const dayjs = (_value: unknown) => ({ format: () => '2026-07-16 09:00', isValid: () => true });
  const ctx = {
    React,
    dataSourceManager: {
      getCollection: () => ({
        filterTargetKey: 'id',
        getFields: () => [
          { interface: 'integer', name: 'id', title: 'ID', type: 'bigInt' },
          { interface: 'input', name: 'name', title: 'Name', type: 'string' },
          { name: 'internal', title: 'Internal', type: 'string' },
        ],
        titleField: 'name',
      }),
    },
    flowSettingsEnabled: true,
    libs: {
      React,
      antd,
      antdIcons: {
        HolderOutlined: 'HolderOutlined',
        ReloadOutlined: 'ReloadOutlined',
        SettingOutlined: 'SettingOutlined',
      },
      dayjs,
    },
    locale: 'en-US',
    makeResource: () => resource,
    message: { error: () => undefined, warning: () => undefined },
    model: flowModel,
    render: (value: unknown) => rendered.push(value),
    runJsSource: { sourceBinding: runJs.sourceBinding, sourceMode: runJs.sourceMode },
    settings,
    t: (text: string) => text,
  };

  const flushEffects = async () => {
    effects.forEach((effect) => effect());
    await Promise.resolve();
    await Promise.resolve();
  };

  return { ctx, flushEffects, rendered, runAction, setTitle };
}

async function expectCollectionTableRuntime(code: string) {
  const unconfiguredRuntime = createCollectionTableRuntime({});
  await executeArtifact(code, unconfiguredRuntime.ctx);
  expect(unconfiguredRuntime.setTitle).toHaveBeenCalledTimes(1);
  expect(unconfiguredRuntime.setTitle).toHaveBeenCalledWith('JS Table');
  expect(unconfiguredRuntime.runAction).not.toHaveBeenCalled();

  const defaultRuntime = createCollectionTableRuntime({ collectionName: 'users' });
  await executeArtifact(code, defaultRuntime.ctx);
  expect(defaultRuntime.setTitle).toHaveBeenCalledTimes(1);
  expect(defaultRuntime.setTitle).toHaveBeenCalledWith('JS Table: users');
  await defaultRuntime.flushEffects();
  expect(defaultRuntime.runAction).toHaveBeenCalledTimes(1);
  const defaultTree = defaultRuntime.rendered.at(-1);
  expect(findElements(defaultTree, 'Typography.Title')).toEqual([]);

  const tables = findElements(defaultTree, 'Table');
  expect(tables).toHaveLength(1);
  const columns = Array.isArray(tables[0].props.columns) ? tables[0].props.columns : [];
  expect(columns.map((column) => (column as Record<string, unknown>).key)).toEqual(['id', 'name']);

  const popovers = findElements(defaultTree, 'Popover');
  expect(popovers).toHaveLength(1);
  expect(readElementText(popovers[0].props.content)).not.toContain('Internal');

  const buttons = findElements(defaultTree, 'Button');
  expect(buttons.map(readElementText)).toContain('Refresh');
  expect(buttons.map(readElementText)).not.toContain('Reload');
  const refreshButton = buttons.find((button) => readElementText(button) === 'Refresh');
  const columnsButton = buttons.find((button) => readElementText(button) === 'Columns');
  expect(columnsButton?.props.size).toBeUndefined();
  expect(refreshButton?.props.size).toBeUndefined();
  expect(typeof refreshButton?.props.onClick).toBe('function');
  (refreshButton?.props.onClick as () => void)();
  await vi.waitFor(() => expect(defaultRuntime.runAction).toHaveBeenCalledTimes(2));
  expect(defaultRuntime.runAction).toHaveBeenLastCalledWith('list', {
    method: 'get',
    params: { fields: ['id', 'name'], page: 1, pageSize: 20 },
  });

  const titledRuntime = createCollectionTableRuntime({ collectionName: 'users', title: 'Members' });
  await executeArtifact(code, titledRuntime.ctx);
  expect(findElements(titledRuntime.rendered.at(-1), 'Typography.Title').map(readElementText)).toEqual(['Members']);
}

function createCollectionBlockRuntime(settings: Record<string, unknown>) {
  const effects: Array<() => unknown> = [];
  const rendered: unknown[] = [];
  const createComponent =
    (type: string) =>
    (props: Record<string, unknown>): TestElement => ({ props, type });
  const form = {
    resetFields: vi.fn(),
    setFieldsValue: vi.fn(),
    validateFields: vi.fn(async (_fieldNames?: string[]) => ({ name: 'Updated user' })),
  };
  const Form = Object.assign(createComponent('Form'), {
    Item: createComponent('Form.Item'),
    useForm: () => [form],
  });
  const Input = Object.assign(createComponent('Input'), { TextArea: createComponent('Input.TextArea') });
  const List = Object.assign(createComponent('List'), { Item: createComponent('List.Item') });
  const Descriptions = Object.assign(createComponent('Descriptions'), {
    Item: createComponent('Descriptions.Item'),
  });
  const Space = Object.assign(createComponent('Space'), { Compact: createComponent('Space.Compact') });
  const React = {
    Fragment: 'Fragment',
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => {
      const nextProps = props && typeof props === 'object' ? { ...(props as Record<string, unknown>) } : {};
      if (children.length) nextProps.children = children.length === 1 ? children[0] : children;
      return typeof type === 'function'
        ? (type as (componentProps: Record<string, unknown>) => unknown)(nextProps)
        : { props: nextProps, type };
    },
    useEffect: (effect: () => unknown, _dependencies: unknown[]) => effects.push(effect),
    useMemo: <T>(factory: () => T) => factory(),
    useRef: <T>(initialValue: T) => ({ current: initialValue }),
    useState: <T>(initialValue: T | (() => T)) => {
      const value = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      return [value, (_nextValue: T) => undefined] as const;
    },
  };
  const antd = {
    Alert: createComponent('Alert'),
    Button: createComponent('Button'),
    Card: createComponent('Card'),
    Checkbox: createComponent('Checkbox'),
    DatePicker: createComponent('DatePicker'),
    Descriptions,
    Empty: createComponent('Empty'),
    Form,
    Input,
    InputNumber: createComponent('InputNumber'),
    List,
    Popover: createComponent('Popover'),
    Select: createComponent('Select'),
    Space,
    Spin: createComponent('Spin'),
    Switch: createComponent('Switch'),
    Tag: createComponent('Tag'),
    TimePicker: createComponent('TimePicker'),
    Typography: {
      Text: createComponent('Typography.Text'),
      Title: createComponent('Typography.Title'),
    },
    theme: {
      useToken: () => ({ token: { marginLG: 24, marginSM: 8 } }),
    },
  };
  const runAction = vi.fn(async (action: string, _options: Record<string, unknown>) => {
    if (action === 'list') {
      return { data: [{ id: 1, name: 'Existing user' }], meta: { count: 1, page: 1 } };
    }
    return { data: { id: 1, name: action === 'get' ? 'Existing user' : 'Updated user' } };
  });
  const resource = {
    runAction,
    setDataSourceKey: (_key: string) => resource,
    setResourceName: (_name: string) => resource,
  };
  const runJs = {
    settings,
    sourceBinding: { entryId: 'lee_collection_block', kind: 'js-block', repoId: 'ler_default', type: 'entry' },
    sourceMode: 'light-extension',
  };
  const setTitle = vi.fn();
  type FakeFlowModel = {
    __lightExtensionCollectionBlockPersistStates?: Record<string, unknown>;
    flowEngine: { getModel: (uid: string) => unknown };
    getStepParams: (flowKey: string, stepKey: string) => unknown;
    saveStepParams: () => Promise<unknown>;
    setTitle: (title: string) => void;
    setStepParams: (flowKey: string, stepKey: string, params: Record<string, unknown>) => void;
    uid: string;
  };
  const flowModel: FakeFlowModel = {
    flowEngine: { getModel: () => flowModel },
    getStepParams: () => runJs,
    saveStepParams: async () => undefined,
    setTitle,
    setStepParams: () => undefined,
    uid: 'collection-block-model',
  };
  const dayjs = (_value: unknown) => ({ format: () => '2026-07-16 09:00', isValid: () => true });
  const ctx = {
    React,
    dataSourceManager: {
      getCollection: () => ({
        filterTargetKey: 'id',
        getFields: () => [
          { interface: 'integer', name: 'id', primaryKey: true, title: 'ID', type: 'bigInt' },
          { interface: 'input', name: 'name', title: 'Name', type: 'string' },
          { name: 'internal', title: 'Internal', type: 'string' },
        ],
        titleField: 'name',
      }),
    },
    flowSettingsEnabled: false,
    libs: {
      React,
      antd,
      antdIcons: {
        DownOutlined: createComponent('DownOutlined'),
        ReloadOutlined: createComponent('ReloadOutlined'),
        SaveOutlined: createComponent('SaveOutlined'),
        SettingOutlined: createComponent('SettingOutlined'),
        UndoOutlined: createComponent('UndoOutlined'),
        UpOutlined: createComponent('UpOutlined'),
      },
      dayjs,
    },
    locale: 'en-US',
    makeResource: () => resource,
    message: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
    model: flowModel,
    render: (value: unknown) => rendered.push(value),
    runJsSource: { sourceBinding: runJs.sourceBinding, sourceMode: runJs.sourceMode },
    settings,
    t: (text: string) => text,
  };

  const flushEffects = async () => {
    effects.forEach((effect) => effect());
    await Promise.resolve();
    await Promise.resolve();
  };

  return { ctx, flushEffects, rendered, runAction, setTitle };
}

async function expectUnconfiguredCollectionBlockRuntime(code: string, title: string) {
  const runtime = createCollectionBlockRuntime({});
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledTimes(1);
  expect(runtime.setTitle).toHaveBeenCalledWith(title);
  expect(runtime.runAction).not.toHaveBeenCalled();
}

async function invokeElementHandler(handler: unknown, argument?: unknown) {
  expect(handler).toEqual(expect.any(Function));
  if (typeof handler === 'function') {
    await Promise.resolve((handler as (value?: unknown) => unknown)(argument));
  }
}

async function expectCreateFormRuntime(code: string) {
  await expectUnconfiguredCollectionBlockRuntime(code, 'JS Add Form');

  const runtime = createCollectionBlockRuntime({ collectionName: 'users' });
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledWith('JS Add Form: users');
  expect(runtime.runAction).not.toHaveBeenCalled();
  const form = findElements(runtime.rendered.at(-1), 'Form');
  expect(form).toHaveLength(1);
  await invokeElementHandler(form[0].props.onFinish, { name: 'Updated user' });
  expect(runtime.runAction).toHaveBeenCalledTimes(1);
  expect(runtime.runAction).toHaveBeenCalledWith('create', { data: { name: 'Updated user' } });
}

async function expectEditFormRuntime(code: string) {
  await expectUnconfiguredCollectionBlockRuntime(code, 'JS Edit Form');

  const runtime = createCollectionBlockRuntime({ collectionName: 'users', recordId: '1' });
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledWith('JS Edit Form: users');
  await runtime.flushEffects();
  await vi.waitFor(() => expect(runtime.runAction).toHaveBeenCalledTimes(1));
  expect(runtime.runAction).toHaveBeenNthCalledWith(1, 'get', {
    method: 'get',
    params: { fields: ['id', 'name'], filterByTk: '1', page: 1, pageSize: 1, sort: ['name'] },
  });
  const form = findElements(runtime.rendered.at(-1), 'Form');
  expect(form).toHaveLength(1);
  await invokeElementHandler(form[0].props.onFinish, { name: 'Updated user' });
  expect(runtime.runAction).toHaveBeenNthCalledWith(2, 'update', {
    data: { name: 'Updated user' },
    params: { filterByTk: '1' },
  });
  expect(runtime.runAction).toHaveBeenNthCalledWith(3, 'get', {
    method: 'get',
    params: { fields: ['id', 'name'], filterByTk: '1', page: 1, pageSize: 1, sort: ['name'] },
  });
}

async function expectDetailsRuntime(code: string) {
  await expectUnconfiguredCollectionBlockRuntime(code, 'JS Details');

  const runtime = createCollectionBlockRuntime({ collectionName: 'users', recordId: '1' });
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledWith('JS Details: users');
  await runtime.flushEffects();
  await vi.waitFor(() => expect(runtime.runAction).toHaveBeenCalledTimes(1));
  expect(runtime.runAction).toHaveBeenCalledWith('get', {
    method: 'get',
    params: { fields: ['id', 'name'], filterByTk: '1', page: 1, pageSize: 1, sort: ['name'] },
  });
}

async function expectCollectionListRuntime(code: string) {
  await expectUnconfiguredCollectionBlockRuntime(code, 'JS List');

  const runtime = createCollectionBlockRuntime({ collectionName: 'users' });
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledWith('JS List: users');
  await runtime.flushEffects();
  await vi.waitFor(() => expect(runtime.runAction).toHaveBeenCalledTimes(1));
  expect(runtime.runAction).toHaveBeenCalledWith('list', {
    method: 'get',
    params: { fields: ['id', 'name'], page: 1, pageSize: 20 },
  });
}

async function expectCollectionGridCardRuntime(code: string) {
  await expectUnconfiguredCollectionBlockRuntime(code, 'JS Grid Card');

  const runtime = createCollectionBlockRuntime({ collectionName: 'users' });
  await executeArtifact(code, runtime.ctx);
  expect(runtime.setTitle).toHaveBeenCalledWith('JS Grid Card: users');
  await runtime.flushEffects();
  await vi.waitFor(() => expect(runtime.runAction).toHaveBeenCalledTimes(1));
  expect(runtime.runAction).toHaveBeenCalledWith('list', {
    method: 'get',
    params: { fields: ['id', 'name'], page: 1, pageSize: 12 },
  });
}
