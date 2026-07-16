/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_LIGHT_EXTENSION_README = `# Light extension source

Put each reusable entry in its own directory:

- JS Block: \`src/client/js-blocks/<entry-name>/index.tsx\`
- JS Action: \`src/client/js-actions/<entry-name>/index.ts\`
- JS Field: \`src/client/js-fields/<entry-name>/index.tsx\`
- JS Item / JS Entry: \`src/client/js-items/<entry-name>/index.tsx\`
- JS Column: reuse \`src/client/js-fields/<entry-name>/index.tsx\` because JS Field and JS Column share the same light-extension kind
- RunJS value: \`src/client/runjs/<entry-name>/index.ts\`

Light Extension supports JS Block, JS Field (including JS Column), JS Action, JS Item, and value-return RunJS entries.

An entry can use \`index.ts\`, \`index.tsx\`, \`index.js\`, or \`index.jsx\`. Keep entry-specific modules in the same entry directory. Put modules shared by multiple entries in \`src/shared/\`.

Every entry root must include \`entry.json\`. Its required \`schemaVersion\` and \`key\` fields define the descriptor version and stable technical identity. The key stays unchanged when the entry directory is renamed.

When \`entry.json.settings\` defines fields, every property is shown as an independent settings menu. Property declaration order controls the menu order. The runtime wraps this field map as an object schema internally, so authors do not need to write \`type: "object"\` or \`properties\` at the root. Set \`required: true\` on a field when it must be configured.

Do not add a \`$schema\` field. Authoring and runtime validation use the bundled contract directly and never probe a Schema URL over the network.

Use \`@nocobase/light-extension-sdk/client\` and \`@nocobase/light-extension-sdk/shared\` for explicit authoring types. Entry settings types are generated from \`entry.json.settings\` by the authoring workspace.
`;

export const LIGHT_EXTENSION_TSCONFIG_CONTENT =
  '{\n  "compilerOptions": {\n    "allowSyntheticDefaultImports": true,\n    "baseUrl": ".",\n    "esModuleInterop": true,\n    "jsx": "react",\n    "module": "ESNext",\n    "moduleResolution": "Node",\n    "resolveJsonModule": true,\n    "skipLibCheck": true,\n    "strict": false,\n    "target": "ES2020"\n  }\n}\n';

export const BASE_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'README.md',
    content: DEFAULT_LIGHT_EXTENSION_README,
    language: 'markdown',
  },
  {
    path: 'tsconfig.json',
    content: LIGHT_EXTENSION_TSCONFIG_CONTENT,
    language: 'json',
  },
];

export const DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  ...BASE_LIGHT_EXTENSION_TEMPLATE_FILES,
  {
    path: 'src/client/js-blocks/welcome-card/index.tsx',
    content: `const { Card, Space, Tag, Typography } = ctx.libs.antd;
const dayjs = ctx.libs.dayjs;
const user = ctx.user ?? ctx.auth?.user ?? null;
const displayName = String(user?.nickname ?? user?.username ?? ctx.t('Anonymous'));
const title = ctx.t(String(ctx.settings?.title || 'Welcome'));
const description = ctx.t(
  String(ctx.settings?.description || 'Build reusable UI with light extensions.'),
);
const accentColor = String(ctx.settings?.accentColor || '#1677ff');

ctx.render(
  <Card size="small" style={{ borderTop: \`3px solid \${accentColor}\` }}>
    <Space direction="vertical" size={4}>
      <Space wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}, {displayName}
        </Typography.Title>
        <Tag color={accentColor}>{ctx.t('Light extension')}</Tag>
      </Space>
      <Typography.Text type="secondary">{description}</Typography.Text>
      {ctx.settings?.showTimestamp !== false ? (
        <Typography.Text type="secondary">{dayjs().format('YYYY-MM-DD HH:mm')}</Typography.Text>
      ) : null}
    </Space>
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/welcome-card/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "welcome-card",
  "title": "Welcome card",
  "description": "Configurable welcome card with a timestamp and accent color.",
  "category": "examples",
  "tags": ["JS Block", "Ant Design"],
  "sort": 10,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Welcome", "required": true, "x-component": "Input" },
    "description": { "type": "string", "title": "Description", "default": "Build reusable UI with light extensions.", "x-component": "Input.TextArea" },
    "accentColor": { "type": "string", "title": "Accent color", "default": "#1677ff", "x-component": "ColorPicker" },
    "showTimestamp": { "type": "boolean", "title": "Show timestamp", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-blocks/collection-summary/index.tsx',
    content: `const { Alert, Card, Empty, List, Typography } = ctx.libs.antd;
const collectionName = String(ctx.settings?.collectionName || 'users');
const displayField = String(ctx.settings?.displayField || 'username');
const pageSize = Number(ctx.settings?.pageSize || 5);
const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

try {
  ctx.initResource('MultiRecordResource');
  const resource = ctx.resource;
  if (!resource.setResourceName || !resource.runAction) {
    throw new Error(ctx.t('Unable to initialize resource'));
  }
  resource.setResourceName(collectionName);
  const result = await resource.runAction('list', {
    method: 'get',
    params: {
      pageSize,
      sort: ['-createdAt'],
    },
  });
  const resultData = toRecord(result).data;
  const rows = Array.isArray(resultData) ? resultData : [];

  ctx.render(
    <Card size="small" title={ctx.t(String(ctx.settings?.title || 'Recent records'))}>
      {rows.length ? (
        <List
          size="small"
          dataSource={rows}
          renderItem={(row) => {
            const record = toRecord(row);
            return (
              <List.Item>
                <Typography.Text>
                  {String(record[displayField] ?? record.name ?? record.id ?? '-')}
                </Typography.Text>
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty description={ctx.t(String(ctx.settings?.emptyText || 'No data'))} />
      )}
    </Card>,
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  ctx.render(
    <Alert
      type="error"
      showIcon
      message={ctx.t('Failed to load data')}
      description={errorMessage}
    />,
  );
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-summary/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "collection-summary",
  "title": "Collection summary",
  "description": "Loads recent records through a MultiRecordResource and renders an Ant Design list.",
  "category": "examples",
  "tags": ["JS Block", "Resource"],
  "sort": 20,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Recent records", "x-component": "Input" },
    "collectionName": { "type": "string", "title": "Collection", "default": "users", "required": true, "x-component": "CollectionSelect" },
    "displayField": { "type": "string", "title": "Display field", "default": "username", "required": true, "x-component": "CollectionFieldSelect", "x-component-props": { "collectionField": "collectionName" } },
    "pageSize": { "type": "integer", "title": "Page size", "default": 5, "minimum": 1, "maximum": 20, "x-component": "InputNumber" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "No data", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-blocks/collection-table/index.tsx',
    content: `type JsonRecord = Record<string, unknown>;
type FormatterKey = 'auto' | 'text' | 'number' | 'date' | 'boolean' | 'relation' | 'json';
type ColumnConfig = {
  field: string;
  scope: string;
  title?: string;
  width: number;
  visible: boolean;
  formatter: FormatterKey;
};
type SortConfig = { field: string; dir: 'asc' | 'desc'; scope?: string };
type CollectionFieldLike = JsonRecord & {
  name?: string;
  title?: string;
  type?: string;
  interface?: string;
  target?: string;
  hidden?: boolean;
  options?: JsonRecord;
  isAssociationField?: () => boolean;
};
type CollectionLike = JsonRecord & {
  filterTargetKey?: string | string[];
  titleField?: string;
  options?: JsonRecord;
  getFields?: () => CollectionFieldLike[];
};
type FieldMeta = {
  name: string;
  title: string;
  type: string;
  interfaceName: string;
  association: boolean;
  defaultFormatter: FormatterKey;
};
type MultiRecordResourceLike = {
  setDataSourceKey?: (key: string) => MultiRecordResourceLike;
  setResourceName?: (name: string) => MultiRecordResourceLike;
  runAction?: (action: string, options: JsonRecord) => Promise<unknown>;
};
type PaginationState = {
  current: number;
  pageSize: number;
  total: number;
  totalKnown: boolean;
};
type PersistState = {
  scope: string;
  flushScheduled: boolean;
  saving: boolean;
  revision: number;
  savedRevision: number;
  patch: JsonRecord;
};
type TableFlowModel = {
  uid: string;
  flowEngine?: {
    getModel?: (uid: string) => unknown;
  };
  getStepParams: (flowKey: string, stepKey: string) => unknown;
  setStepParams: (flowKey: string, stepKey: string, params: JsonRecord) => void;
  saveStepParams: () => Promise<unknown>;
  __lightExtensionCollectionTablePersistState?: PersistState;
};
type TableRuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const React = ctx.libs.React;
const {
  Alert,
  Button,
  Checkbox,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  theme,
  Tooltip,
  Typography,
} = ctx.libs.antd;
const { HolderOutlined, ReloadOutlined, SettingOutlined } = ctx.libs.antdIcons;
const dayjs = ctx.libs.dayjs;

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const cloneJson = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};
const readProperty = (value: unknown, key: string): unknown => {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as JsonRecord;
  if (record[key] !== undefined) return record[key];
  return isRecord(record.options) ? record.options[key] : undefined;
};
const toNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;
const toPositiveInteger = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const sameJson = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
const formatterKeys = new Set<FormatterKey>(['auto', 'text', 'number', 'date', 'boolean', 'relation', 'json']);

const settings = isRecord(ctx.settings) ? ctx.settings : {};
const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
const collectionName = toNonEmptyString(settings.collectionName);
const tableDataScope = dataSourceKey + ':' + (collectionName || '');
const runtimeContext = ctx as unknown as TableRuntimeContext;
const configurable = Boolean(runtimeContext.flowSettingsEnabled);
const pageSize = toPositiveInteger(settings.pageSize, 20, 5, 200);
const tableHeight = toPositiveInteger(settings.height, 480, 240, 1200);
const maxInitialColumns = toPositiveInteger(settings.maxInitialColumns, 8, 1, 20);
const flowModel = ctx.model as unknown as TableFlowModel;
const getSourceIdentity = (runJs: JsonRecord): string => {
  const sourceBinding = isRecord(runJs.sourceBinding) ? runJs.sourceBinding : {};
  return [runJs.sourceMode, sourceBinding.type, sourceBinding.repoId, sourceBinding.entryId, sourceBinding.kind]
    .map((value) => String(value || ''))
    .join(':');
};
const buildPersistScope = (runJs: JsonRecord, runSettings: JsonRecord): string =>
  [
    toNonEmptyString(runSettings.dataSourceKey) || 'main',
    toNonEmptyString(runSettings.collectionName) || '',
    getSourceIdentity(runJs),
  ].join('|');
const initialRunJsValue = flowModel.getStepParams('jsSettings', 'runJs');
const initialRunJs = isRecord(initialRunJsValue) ? initialRunJsValue : {};
const initialSourceInfo: JsonRecord = isRecord(ctx.runJsSource) ? ctx.runJsSource : {};
const runJsForScope = isRecord(initialRunJs.sourceBinding)
  ? initialRunJs
  : {
      ...initialRunJs,
      sourceMode: initialRunJs.sourceMode || initialSourceInfo.sourceMode,
      sourceBinding: initialSourceInfo.sourceBinding,
    };
const persistScope = buildPersistScope(runJsForScope, settings);

const getPersistState = (): PersistState => {
  const current = flowModel.__lightExtensionCollectionTablePersistState;
  if (!current || current.scope !== persistScope) {
    flowModel.__lightExtensionCollectionTablePersistState = {
      scope: persistScope,
      flushScheduled: false,
      saving: false,
      revision: 0,
      savedRevision: 0,
      patch: {},
    };
  }
  return flowModel.__lightExtensionCollectionTablePersistState;
};
const persistState = getPersistState();

const isCurrentPersistState = (state: PersistState): boolean =>
  flowModel.__lightExtensionCollectionTablePersistState === state;
const isFlowModelActive = (): boolean => {
  const getModel = flowModel.flowEngine?.getModel;
  return typeof getModel !== 'function' || flowModel.flowEngine?.getModel?.(flowModel.uid) === flowModel;
};
const saveStableStepParams = async () => {
  await flowModel.saveStepParams();
  while (isFlowModelActive()) {
    const beforeSave = cloneJson(flowModel.getStepParams('jsSettings', 'runJs'));
    await flowModel.saveStepParams();
    const afterSave = flowModel.getStepParams('jsSettings', 'runJs');
    if (sameJson(beforeSave, afterSave)) return;
  }
};

const reportPersistError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  ctx.message.error(ctx.t('Failed to save table configuration') + ': ' + message);
};

const flushSettingsPatch = async (state: PersistState) => {
  if (
    !isCurrentPersistState(state) ||
    !isFlowModelActive() ||
    state.saving ||
    state.savedRevision >= state.revision
  ) {
    return;
  }
  state.saving = true;
  let failed = false;

  try {
    while (isCurrentPersistState(state) && isFlowModelActive() && state.savedRevision < state.revision) {
      const targetRevision = state.revision;
      const patch = cloneJson(state.patch);
      const runJsValue = flowModel.getStepParams('jsSettings', 'runJs');
      const runJs = isRecord(runJsValue) ? runJsValue : {};
      const currentSettings = isRecord(runJs.settings) ? runJs.settings : {};
      const currentScope = buildPersistScope(runJs, currentSettings);
      if (currentScope !== state.scope) {
        state.savedRevision = state.revision;
        state.patch = {};
        break;
      }
      const nextSettings = { ...currentSettings, ...patch };

      if (!sameJson(currentSettings, nextSettings)) {
        flowModel.setStepParams('jsSettings', 'runJs', { settings: nextSettings });
        await saveStableStepParams();
        if (!isCurrentPersistState(state) || !isFlowModelActive()) break;
        const latestRunJsValue = flowModel.getStepParams('jsSettings', 'runJs');
        const latestRunJs = isRecord(latestRunJsValue) ? latestRunJsValue : {};
        const latestSettings = isRecord(latestRunJs.settings) ? latestRunJs.settings : {};
        if (buildPersistScope(latestRunJs, latestSettings) !== state.scope) break;
      }
      state.savedRevision = targetRevision;
    }
    state.patch = {};
  } catch (error) {
    failed = true;
    reportPersistError(error);
  } finally {
    state.saving = false;
    if (!failed && isCurrentPersistState(state) && isFlowModelActive() && state.savedRevision < state.revision) {
      flushSettingsPatch(state).catch(reportPersistError);
    }
  }
};

const scheduleSettingsPatch = (patch: JsonRecord) => {
  if (!configurable || !isCurrentPersistState(persistState) || !isFlowModelActive()) return;
  const state = persistState;
  state.patch = { ...state.patch, ...cloneJson(patch) };
  state.revision += 1;
  if (state.flushScheduled) return;
  state.flushScheduled = true;
  Promise.resolve()
    .then(() => {
      state.flushScheduled = false;
      return flushSettingsPatch(state);
    })
    .catch(reportPersistError);
};

const resolveDefaultFormatter = (type: string, interfaceName: string, association: boolean): FormatterKey => {
  if (association) return 'relation';
  const signature = (interfaceName + ' ' + type).toLowerCase();
  if (signature.includes('bool')) return 'boolean';
  if (signature.includes('date') || signature.includes('time')) return 'date';
  if (/integer|number|decimal|double|float|percent/.test(signature)) return 'number';
  if (signature.includes('json')) return 'json';
  return 'text';
};

const getFieldMetas = (collection: CollectionLike): FieldMeta[] => {
  const fields = typeof collection.getFields === 'function' ? collection.getFields() : [];
  return fields.flatMap((field) => {
    const name = toNonEmptyString(readProperty(field, 'name'));
    const type = toNonEmptyString(readProperty(field, 'type')) || '';
    const interfaceName = toNonEmptyString(readProperty(field, 'interface')) || '';
    if (
      !name ||
      readProperty(field, 'hidden') === true ||
      (interfaceName + ' ' + type).toLowerCase().includes('password')
    ) {
      return [];
    }
    const target = toNonEmptyString(readProperty(field, 'target'));
    const associationTypes = ['belongsTo', 'belongsToMany', 'belongsToArray', 'hasOne', 'hasMany'];
    const association =
      (typeof field.isAssociationField === 'function' && field.isAssociationField()) ||
      Boolean(target) ||
      associationTypes.includes(type);
    const title = ctx.t(String(readProperty(field, 'title') || name));
    return [
      {
        name,
        title,
        type,
        interfaceName,
        association,
        defaultFormatter: resolveDefaultFormatter(type, interfaceName, association),
      },
    ];
  });
};

const normalizeColumns = (
  fields: FieldMeta[],
  rawColumns: unknown,
  primaryKeys: string[],
  titleField: string | undefined,
  expectedScope: string,
): ColumnConfig[] => {
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const savedColumns = Array.isArray(rawColumns) ? rawColumns : [];
  const output: ColumnConfig[] = [];
  const used = new Set<string>();

  for (const rawColumn of savedColumns) {
    if (!isRecord(rawColumn)) continue;
    const savedScope = toNonEmptyString(rawColumn.scope);
    if (savedScope && savedScope !== expectedScope) continue;
    const fieldName = toNonEmptyString(rawColumn.field);
    const field = fieldName ? fieldMap.get(fieldName) : undefined;
    if (!field || used.has(field.name)) continue;
    const formatter = formatterKeys.has(rawColumn.formatter as FormatterKey)
      ? (rawColumn.formatter as FormatterKey)
      : 'auto';
    output.push({
      field: field.name,
      scope: expectedScope,
      title: toNonEmptyString(rawColumn.title),
      width: toPositiveInteger(rawColumn.width, 160, 60, 1000),
      visible: rawColumn.visible !== false,
      formatter,
    });
    used.add(field.name);
  }

  const preferredNames = [...primaryKeys, titleField].filter(
    (name, index, values): name is string => Boolean(name) && values.indexOf(name) === index,
  );
  const orderedFields = [
    ...preferredNames.map((name) => fieldMap.get(name)).filter((field): field is FieldMeta => Boolean(field)),
    ...fields.filter((field) => !preferredNames.includes(field.name)),
  ];
  const hasSavedColumns = output.length > 0;

  for (const field of orderedFields) {
    if (used.has(field.name)) continue;
    output.push({
      field: field.name,
      scope: expectedScope,
      width: 160,
      visible: !hasSavedColumns && output.length < maxInitialColumns,
      formatter: 'auto',
    });
    used.add(field.name);
  }

  return output;
};

const normalizeSort = (value: unknown, fields: Map<string, FieldMeta>, expectedScope?: string): SortConfig[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const savedScope = toNonEmptyString(item.scope);
    if (expectedScope && savedScope && savedScope !== expectedScope) return [];
    const field = toNonEmptyString(item.field);
    const dir = item.dir === 'desc' ? 'desc' : 'asc';
    return field && fields.has(field) ? [{ field, dir, ...(expectedScope ? { scope: expectedScope } : {}) }] : [];
  });
};

const normalizeAntdSort = (
  value: unknown,
  fields: Map<string, FieldMeta>,
  expectedScope: string,
): SortConfig[] => {
  const items = Array.isArray(value) ? value : [value];
  return items
    .flatMap((item) => {
      if (!isRecord(item) || (item.order !== 'ascend' && item.order !== 'descend')) return [];
      const rawField = Array.isArray(item.field) ? item.field.join('.') : item.columnKey ?? item.field;
      const field = toNonEmptyString(rawField);
      if (!field || !fields.has(field)) return [];
      return [{ field, dir: item.order === 'descend' ? 'desc' : 'asc', scope: expectedScope } as SortConfig];
    })
    .slice(0, 1);
};

const valueToText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.map(valueToText).join(', ');
  if (isRecord(value)) {
    const candidate = value.title ?? value.name ?? value.nickname ?? value.username ?? value.id;
    return candidate === undefined ? JSON.stringify(value) : valueToText(candidate);
  }
  return String(value);
};

const renderCellValue = (config: ColumnConfig, field: FieldMeta, value: unknown) => {
  const formatter = config.formatter === 'auto' ? field.defaultFormatter : config.formatter;
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  if (formatter === 'boolean') {
    const checked =
      value === true || value === 1 || value === '1' || (typeof value === 'string' && value.toLowerCase() === 'true');
    return <Tag color={checked ? 'success' : 'default'}>{checked ? ctx.t('Yes') : ctx.t('No')}</Tag>;
  }

  let text = valueToText(value);
  if (formatter === 'number') {
    const numberValue = typeof value === 'number' ? value : Number(value);
    text = Number.isFinite(numberValue) ? new Intl.NumberFormat(ctx.locale).format(numberValue) : '-';
  } else if (formatter === 'date') {
    const dateValue = value === null || value === undefined ? null : dayjs(value as string | number | Date);
    text = dateValue?.isValid?.() ? dateValue.format('YYYY-MM-DD HH:mm') : '-';
  } else if (formatter === 'json') {
    try {
      text = value === undefined ? '-' : JSON.stringify(value);
    } catch {
      text = valueToText(value);
    }
  }

  return (
    <Typography.Text
      code={formatter === 'json'}
      ellipsis={{ tooltip: text }}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {text}
    </Typography.Text>
  );
};

const getCollectionString = (collection: CollectionLike, key: string): string | undefined =>
  toNonEmptyString(readProperty(collection, key));

async function runCollectionTable() {
  if (!collectionName) {
    ctx.render(
      <Alert
        type="info"
        showIcon
        message={ctx.t('Select a collection')}
        description={ctx.t('Open the block settings and choose the collection to display.')}
      />,
    );
    return;
  }

  const dataSourceManager = runtimeContext.dataSourceManager;
  const collection = dataSourceManager?.getCollection?.(dataSourceKey, collectionName);
  if (!collection) {
    ctx.render(
      <Alert
        type="error"
        showIcon
        message={ctx.t('Collection not found')}
        description={collectionName}
      />,
    );
    return;
  }

  const fields = getFieldMetas(collection);
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No fields are available for this collection')} />);
    return;
  }

  const primaryKeyValue = readProperty(collection, 'filterTargetKey');
  const primaryKeys = (Array.isArray(primaryKeyValue) ? primaryKeyValue : [primaryKeyValue]).flatMap((value) => {
    const key = toNonEmptyString(value);
    return key ? [key] : [];
  });
  if (!primaryKeys.length) primaryKeys.push('id');
  const titleField = getCollectionString(collection, 'titleField');
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const headerIdPrefix = 'light-extension-table-' + flowModel.uid.replace(/[^A-Za-z0-9_-]/g, '-');
  const headerIdByField = new Map(fields.map((field, index) => [field.name, headerIdPrefix + '-' + index]));
  const headerFieldById = new Map(Array.from(headerIdByField, ([fieldName, id]) => [id, fieldName]));
  const initialColumns = normalizeColumns(fields, settings.columns, primaryKeys, titleField, tableDataScope);
  const initialSort = normalizeSort(settings.sort, fieldMap, tableDataScope);
  const resource = ctx.makeResource('MultiRecordResource') as unknown as MultiRecordResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);

  const formatterOptions = [
    { label: ctx.t('Automatic'), value: 'auto' },
    { label: ctx.t('Text'), value: 'text' },
    { label: ctx.t('Number'), value: 'number' },
    { label: ctx.t('Date and time'), value: 'date' },
    { label: ctx.t('Boolean'), value: 'boolean' },
    { label: ctx.t('Relation'), value: 'relation' },
    { label: ctx.t('JSON'), value: 'json' },
  ];
  const getColumnTitle = (column: ColumnConfig): string =>
    column.title || fieldMap.get(column.field)?.title || column.field;

  const CollectionTable = () => {
    const { token } = theme.useToken();
    const tokenRef = React.useRef(token);
    tokenRef.current = token;
    const mountedRef = React.useRef(true);
    const requestRevisionRef = React.useRef(0);
    const resizeCleanupRef = React.useRef<(() => void) | null>(null);
    const dragFieldRef = React.useRef<string | null>(null);
    const columnsRef = React.useRef<ColumnConfig[]>(initialColumns);
    const sortRef = React.useRef<SortConfig[]>(initialSort);
    const paginationRef = React.useRef<PaginationState>({
      current: 1,
      pageSize,
      total: 0,
      totalKnown: false,
    });
    const [columns, setColumns] = React.useState<ColumnConfig[]>(initialColumns);
    const [sort, setSort] = React.useState<SortConfig[]>(initialSort);
    const [pagination, setPagination] = React.useState<PaginationState>({
      current: 1,
      pageSize,
      total: 0,
      totalKnown: false,
    });
    const [rows, setRows] = React.useState<JsonRecord[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [runtimeError, setRuntimeError] = React.useState<string | null>(null);

    const syncColumns = (nextColumns: ColumnConfig[]) => {
      columnsRef.current = nextColumns;
      setColumns(nextColumns);
    };
    const syncSort = (nextSort: SortConfig[]) => {
      sortRef.current = nextSort;
      setSort(nextSort);
    };
    const syncPagination = (nextPagination: PaginationState) => {
      paginationRef.current = nextPagination;
      setPagination(nextPagination);
    };

    const loadRows = async (
      nextPage: number,
      nextPageSize: number,
      nextSort: SortConfig[],
      nextColumns: ColumnConfig[],
    ) => {
      const requestRevision = requestRevisionRef.current + 1;
      requestRevisionRef.current = requestRevision;
      if (mountedRef.current) {
        setLoading(true);
        setRuntimeError(null);
      }

      const visibleFields = nextColumns
        .filter((column) => column.visible)
        .map((column) => fieldMap.get(column.field))
        .filter((field): field is FieldMeta => Boolean(field));
      const scalarFields = Array.from(
        new Set([...primaryKeys, ...visibleFields.filter((field) => !field.association).map((field) => field.name)]),
      );
      const appends = visibleFields.filter((field) => field.association).map((field) => field.name);
      const requestSort = nextSort.map((item) => (item.dir === 'desc' ? '-' + item.field : item.field));
      const requestParams: JsonRecord = {
        page: nextPage,
        pageSize: nextPageSize,
        fields: scalarFields,
      };
      if (appends.length) requestParams.appends = appends;
      if (requestSort.length) requestParams.sort = requestSort;

      if (typeof resource.runAction !== 'function') {
        if (mountedRef.current) {
          setRuntimeError(ctx.t('Unable to initialize collection resource'));
          setLoading(false);
        }
        return;
      }

      try {
        const result = await resource.runAction('list', { method: 'get', params: requestParams });
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        const resultRecord = isRecord(result) ? result : {};
        const nextRows = Array.isArray(resultRecord.data) ? resultRecord.data.filter(isRecord) : [];
        const meta = isRecord(resultRecord.meta) ? resultRecord.meta : {};
        const currentPage = toPositiveInteger(meta.page, nextPage, 1, Number.MAX_SAFE_INTEGER);
        const countValue = Number(meta.count);
        const hasCount = Number.isFinite(countValue) && countValue >= 0;
        const totalPageValue = Number(meta.totalPage);
        const hasTotalPage = Number.isFinite(totalPageValue) && totalPageValue >= 1;
        const hasNext = meta.hasNext === true;
        const totalPage = hasTotalPage
          ? toPositiveInteger(totalPageValue, currentPage, 1, Number.MAX_SAFE_INTEGER)
          : currentPage;
        const inferredTotal = hasTotalPage
          ? Math.max(
              nextRows.length,
              (totalPage - 1) * nextPageSize + (currentPage === totalPage ? nextRows.length : nextPageSize),
            )
          : (currentPage - 1) * nextPageSize + nextRows.length + (hasNext ? 1 : 0);
        const total = hasCount ? Math.round(countValue) : inferredTotal;

        setRows(nextRows);
        syncPagination({
          current: currentPage,
          pageSize: nextPageSize,
          total,
          totalKnown: hasCount,
        });
      } catch (error) {
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        setRuntimeError(error instanceof Error ? error.message : String(error));
      } finally {
        if (mountedRef.current && requestRevisionRef.current === requestRevision) setLoading(false);
      }
    };

    const moveColumn = (sourceField: string, targetField: string) => {
      if (!configurable || sourceField === targetField) return;
      const currentColumns = columnsRef.current;
      const sourceIndex = currentColumns.findIndex((column) => column.field === sourceField);
      const targetIndex = currentColumns.findIndex((column) => column.field === targetField);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const nextColumns = [...currentColumns];
      const [movedColumn] = nextColumns.splice(sourceIndex, 1);
      if (!movedColumn) return;
      nextColumns.splice(targetIndex, 0, movedColumn);
      syncColumns(nextColumns);
      scheduleSettingsPatch({ columns: nextColumns });
    };

    const moveColumnByOffset = (fieldName: string, offset: -1 | 1) => {
      const visibleColumns = columnsRef.current.filter((column) => column.visible);
      const sourceIndex = visibleColumns.findIndex((column) => column.field === fieldName);
      const target = visibleColumns[sourceIndex + offset];
      if (sourceIndex < 0 || !target) return;
      moveColumn(fieldName, target.field);
    };

    const resizeColumnByKeyboard = (fieldName: string, delta: number) => {
      const nextColumns = columnsRef.current.map((column) =>
        column.field === fieldName
          ? { ...column, width: toPositiveInteger(column.width + delta, column.width, 60, 1000) }
          : column,
      );
      syncColumns(nextColumns);
      scheduleSettingsPatch({ columns: nextColumns });
    };

    const beginColumnResize = (
      event: { clientX: number; preventDefault: () => void; stopPropagation: () => void },
      fieldName: string,
    ) => {
      if (!configurable) return;
      const currentColumn = columnsRef.current.find((column) => column.field === fieldName);
      if (!currentColumn) return;
      event.preventDefault();
      event.stopPropagation();
      resizeCleanupRef.current?.();

      const startX = event.clientX;
      const startWidth = currentColumn.width;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      let nextWidth = startWidth;
      let animationFrame: number | null = null;

      const applyWidth = () => {
        animationFrame = null;
        const nextColumns = columnsRef.current.map((column) =>
          column.field === fieldName ? { ...column, width: nextWidth } : column,
        );
        syncColumns(nextColumns);
      };
      const restoreBodyStyle = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
      };
      const onPointerMove = (moveEvent: PointerEvent) => {
        nextWidth = toPositiveInteger(startWidth + moveEvent.clientX - startX, startWidth, 60, 1000);
        if (animationFrame === null) animationFrame = window.requestAnimationFrame(applyWidth);
      };
      const removeListeners = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', finishResize);
        document.removeEventListener('pointercancel', cancelResize);
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        restoreBodyStyle();
      };
      const finishResize = () => {
        removeListeners();
        applyWidth();
        resizeCleanupRef.current = null;
        scheduleSettingsPatch({ columns: columnsRef.current });
      };
      const cancelResize = () => {
        removeListeners();
        resizeCleanupRef.current = null;
        if (!mountedRef.current) return;
        const restoredColumns = columnsRef.current.map((column) =>
          column.field === fieldName ? { ...column, width: startWidth } : column,
        );
        syncColumns(restoredColumns);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', finishResize);
      document.addEventListener('pointercancel', cancelResize);
      resizeCleanupRef.current = cancelResize;
    };

    const HeaderCell = React.useMemo(() => {
      const StableHeaderCell = (props: JsonRecord) => {
        const fieldName = headerFieldById.get(toNonEmptyString(props.id) || '');
        const children = props.children;
        const style = isRecord(props.style) ? props.style : {};
        const paddingLeft =
          typeof style.paddingLeft === 'number' || typeof style.paddingLeft === 'string'
            ? style.paddingLeft
            : undefined;
        const rest = { ...props };
        delete rest.children;
        delete rest.style;
        const columnTitle = fieldName
          ? getColumnTitle({ field: fieldName, scope: tableDataScope, width: 160, visible: true, formatter: 'auto' })
          : '';
        const dragLabel = ctx.t('Drag column') + (columnTitle ? ': ' + columnTitle : '');
        const resizeLabel = ctx.t('Resize column') + (columnTitle ? ': ' + columnTitle : '');

        return (
          <th
            {...rest}
            data-column-field={fieldName}
            style={{
              ...style,
              paddingLeft: configurable && fieldName ? 36 : paddingLeft,
              position: 'relative',
            }}
            onDragOver={(dragEvent) => {
              if (!configurable || !fieldName) return;
              dragEvent.preventDefault();
              dragEvent.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(dropEvent) => {
              if (!configurable || !fieldName) return;
              dropEvent.preventDefault();
              dropEvent.stopPropagation();
              const sourceField = dragFieldRef.current || dropEvent.dataTransfer.getData('text/plain');
              dragFieldRef.current = null;
              if (sourceField) moveColumn(sourceField, fieldName);
            }}
          >
            {children as never}
            {configurable && fieldName ? (
              <>
                <Tooltip title={dragLabel}>
                  <span
                    role="button"
                    aria-label={dragLabel}
                    data-column-drag-handle={fieldName}
                    draggable
                    tabIndex={0}
                    style={{
                      alignItems: 'center',
                      color: String(tokenRef.current.colorTextQuaternary || '#8c8c8c'),
                      cursor: 'grab',
                      display: 'inline-flex',
                      height: 24,
                      justifyContent: 'center',
                      left: 8,
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 20,
                      zIndex: 2,
                    }}
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    onDragStart={(dragEvent) => {
                      dragFieldRef.current = fieldName;
                      dragEvent.dataTransfer.effectAllowed = 'move';
                      dragEvent.dataTransfer.setData('text/plain', fieldName);
                      dragEvent.stopPropagation();
                    }}
                    onDragEnd={() => {
                      dragFieldRef.current = null;
                    }}
                    onKeyDown={(keyEvent) => {
                      keyEvent.stopPropagation();
                      if (keyEvent.key !== 'ArrowLeft' && keyEvent.key !== 'ArrowRight') return;
                      keyEvent.preventDefault();
                      moveColumnByOffset(fieldName, keyEvent.key === 'ArrowLeft' ? -1 : 1);
                    }}
                  >
                    <HolderOutlined />
                  </span>
                </Tooltip>
                <Tooltip title={resizeLabel}>
                  <span
                    role="separator"
                    aria-label={resizeLabel}
                    aria-orientation="vertical"
                    aria-valuemin={60}
                    aria-valuemax={1000}
                    aria-valuenow={columnsRef.current.find((column) => column.field === fieldName)?.width || 160}
                    data-column-resize-handle={fieldName}
                    tabIndex={0}
                    style={{
                      bottom: 0,
                      cursor: 'col-resize',
                      position: 'absolute',
                      right: -4,
                      top: 0,
                      width: 8,
                      zIndex: 3,
                    }}
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    onPointerDown={(pointerEvent) => beginColumnResize(pointerEvent, fieldName)}
                    onKeyDown={(keyEvent) => {
                      keyEvent.stopPropagation();
                      if (keyEvent.key !== 'ArrowLeft' && keyEvent.key !== 'ArrowRight') return;
                      keyEvent.preventDefault();
                      resizeColumnByKeyboard(fieldName, keyEvent.key === 'ArrowLeft' ? -10 : 10);
                    }}
                  />
                </Tooltip>
              </>
            ) : null}
          </th>
        );
      };

      return StableHeaderCell;
    }, []);

    React.useEffect(() => {
      mountedRef.current = true;
      loadRows(1, pageSize, initialSort, initialColumns);
      return () => {
        mountedRef.current = false;
        requestRevisionRef.current += 1;
        resizeCleanupRef.current?.();
        resizeCleanupRef.current = null;
      };
    }, []);

    const toggleColumn = (fieldName: string, visible: boolean) => {
      if (!visible && columnsRef.current.filter((column) => column.visible).length <= 1) {
        ctx.message.warning(ctx.t('Keep at least one visible column'));
        return;
      }
      const nextColumns = columnsRef.current.map((column) =>
        column.field === fieldName ? { ...column, visible } : column,
      );
      const hidesSortedColumn = !visible && sortRef.current.some((item) => item.field === fieldName);
      const nextSort = hidesSortedColumn ? [] : sortRef.current;
      syncColumns(nextColumns);
      if (hidesSortedColumn) syncSort(nextSort);
      scheduleSettingsPatch({ columns: nextColumns, ...(hidesSortedColumn ? { sort: nextSort } : {}) });
      if (visible || hidesSortedColumn) {
        loadRows(paginationRef.current.current, paginationRef.current.pageSize, nextSort, nextColumns);
      }
    };

    const changeFormatter = (fieldName: string, formatter: FormatterKey) => {
      const nextColumns = columnsRef.current.map((column) =>
        column.field === fieldName ? { ...column, formatter } : column,
      );
      syncColumns(nextColumns);
      scheduleSettingsPatch({ columns: nextColumns });
    };

    const handleTableChange = (paginationValue: unknown, _filters: unknown, sorterValue: unknown) => {
      const paginationRecord = isRecord(paginationValue) ? paginationValue : {};
      const nextPageSize = toPositiveInteger(
        paginationRecord.pageSize,
        paginationRef.current.pageSize,
        5,
        200,
      );
      const nextSort = normalizeAntdSort(sorterValue, fieldMap, tableDataScope);
      const sortChanged = !sameJson(sortRef.current, nextSort);
      const nextPage = sortChanged
        ? 1
        : toPositiveInteger(paginationRecord.current, paginationRef.current.current, 1, Number.MAX_SAFE_INTEGER);
      const patch: JsonRecord = {};
      if (sortChanged) patch.sort = nextSort;
      if (nextPageSize !== paginationRef.current.pageSize) patch.pageSize = nextPageSize;
      if (Object.keys(patch).length) scheduleSettingsPatch(patch);

      syncSort(nextSort);
      syncPagination({
        current: nextPage,
        pageSize: nextPageSize,
        total: paginationRef.current.total,
        totalKnown: paginationRef.current.totalKnown,
      });
      loadRows(nextPage, nextPageSize, nextSort, columnsRef.current);
    };

    const reloadTable = () => {
      loadRows(
        paginationRef.current.current,
        paginationRef.current.pageSize,
        sortRef.current,
        columnsRef.current,
      );
    };

    const antdColumns = columns
      .filter((column) => column.visible)
      .flatMap((column) => {
        const field = fieldMap.get(column.field);
        if (!field) return [];
        const effectiveFormatter = column.formatter === 'auto' ? field.defaultFormatter : column.formatter;
        const activeSort = sort.find((item) => item.field === column.field);
        const align: 'left' | 'right' = effectiveFormatter === 'number' ? 'right' : 'left';
        const sortOrder: 'ascend' | 'descend' | null = activeSort
          ? activeSort.dir === 'desc'
            ? 'descend'
            : 'ascend'
          : null;
        return [
          {
            title: getColumnTitle(column),
            dataIndex: column.field,
            key: column.field,
            width: column.width,
            align,
            ellipsis: true,
            sorter: !field.association,
            sortOrder,
            render: (value: unknown) => renderCellValue(column, field, value),
            ...(configurable
              ? {
                  onHeaderCell: () => ({
                    id: headerIdByField.get(column.field),
                  }),
                }
              : {}),
          },
        ];
      });

    const getRowKey = (record: JsonRecord, index?: number): string => {
      const parts = primaryKeys.flatMap((key) => {
        const value = record[key];
        return value === undefined || value === null || value === '' ? [] : [String(value)];
      });
      return parts.length ? parts.join('|') : String(index ?? 0);
    };

    const columnChooser = (
      <div style={{ maxHeight: 360, minWidth: 360, overflow: 'auto', padding: 4 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {columns.map((column) => (
            <div
              key={column.field}
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: 8,
                gridTemplateColumns: 'minmax(180px, 1fr) 120px',
              }}
            >
              <Checkbox
                checked={column.visible}
                onChange={(event) => toggleColumn(column.field, event.target.checked)}
              >
                <Typography.Text title={column.field}>{getColumnTitle(column)}</Typography.Text>
              </Checkbox>
              <Select
                aria-label={ctx.t('Column format') + ': ' + getColumnTitle(column)}
                size="small"
                options={formatterOptions}
                value={column.formatter}
                onChange={(value) => changeFormatter(column.field, value as FormatterKey)}
              />
            </div>
          ))}
        </Space>
      </div>
    );

    const totalColumnWidth = antdColumns.reduce(
      (total: number, column: JsonRecord) => total + toPositiveInteger(column.width, 160, 60, 1000),
      0,
    );

    return (
      <div>
        <Space
          wrap
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: token.marginSM,
          }}
        >
          <Typography.Title level={5} style={{ margin: 0 }}>
            {ctx.t(String(settings.title || 'Collection table'))}
          </Typography.Title>
          <Space>
            {configurable && settings.showColumnManager !== false ? (
              <Popover content={columnChooser} placement="bottomRight" trigger="click">
                <Button icon={<SettingOutlined />} size="small">
                  {ctx.t('Columns')}
                </Button>
              </Popover>
            ) : null}
            <Button icon={<ReloadOutlined />} size="small" onClick={reloadTable}>
              {ctx.t('Reload')}
            </Button>
          </Space>
        </Space>
        {runtimeError ? (
          <Alert
            closable
            type="error"
            showIcon
            message={ctx.t('Failed to load data')}
            description={runtimeError}
            style={{ marginBottom: token.marginSM }}
          />
        ) : null}
        <Table
          components={configurable ? { header: { cell: HeaderCell } } : undefined}
          columns={antdColumns}
          dataSource={rows}
          loading={loading}
          locale={{ emptyText: ctx.t(String(settings.emptyText || 'No data')) }}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: [10, 20, 50, 100],
            showSizeChanger: true,
            ...(pagination.totalKnown
              ? {
                  showTotal: (total: number) => ctx.t('Total') + ' ' + total + ' ' + ctx.t('items'),
                }
              : {}),
          }}
          rowKey={getRowKey}
          scroll={{ x: Math.max(800, totalColumnWidth), y: tableHeight }}
          showSorterTooltip={{ target: 'sorter-icon' }}
          size="middle"
          tableLayout="fixed"
        />
      </div>
    );
  };

  ctx.render(<CollectionTable />);
}

ctx.render(<Alert type="info" showIcon message={ctx.t('Loading table')} />);
try {
  await runCollectionTable();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  ctx.render(<Alert type="error" showIcon message={ctx.t('Failed to initialize table')} description={message} />);
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-table/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "collection-table",
  "title": "Collection table",
  "description": "A lightweight Ant Design table with collection binding, column management, remote sorting, pagination, drag-to-reorder columns, resize handles, and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "Table", "Ant Design"],
  "sort": 30,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Collection table", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "pageSize": { "type": "integer", "title": "Page size", "default": 20, "minimum": 5, "maximum": 200, "x-component": "InputNumber" },
    "height": { "type": "integer", "title": "Table height", "default": 480, "minimum": 240, "maximum": 1200, "x-component": "InputNumber" },
    "maxInitialColumns": { "type": "integer", "title": "Initial visible columns", "default": 8, "minimum": 1, "maximum": 20, "x-component": "InputNumber" },
    "showColumnManager": { "type": "boolean", "title": "Show column manager", "default": true, "x-component": "Switch" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "No data", "x-component": "Input" },
    "columns": {
      "type": "array",
      "title": "Saved columns",
      "default": [],
      "items": {
        "type": "object",
        "required": ["field", "width", "visible", "formatter"],
        "properties": {
          "field": { "type": "string" },
          "scope": { "type": "string" },
          "title": { "type": "string" },
          "width": { "type": "integer", "minimum": 60, "maximum": 1000 },
          "visible": { "type": "boolean" },
          "formatter": { "type": "string", "enum": ["auto", "text", "number", "date", "boolean", "relation", "json"] }
        }
      }
    },
    "sort": {
      "type": "array",
      "title": "Saved sorting",
      "default": [],
      "items": {
        "type": "object",
        "required": ["field", "dir"],
        "properties": {
          "field": { "type": "string" },
          "dir": { "type": "string", "enum": ["asc", "desc"] },
          "scope": { "type": "string" }
        }
      }
    }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-actions/refresh-data/index.ts',
    content: `const resource = ctx.resource;

if (!resource?.refresh) {
  ctx.message.warning(ctx.t(String(ctx.settings?.unavailableMessage || 'No resource to refresh')));
  return;
}

await resource.refresh();
if (ctx.settings?.notifySuccess !== false) {
  ctx.message.success(ctx.t(String(ctx.settings?.successMessage || 'Resource refreshed')));
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/refresh-data/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "refresh-data",
  "title": "Refresh data",
  "description": "Refreshes the current resource and optionally shows a success message.",
  "category": "examples",
  "tags": ["JS Action", "Resource"],
  "sort": 10,
  "settings": {
    "successMessage": { "type": "string", "title": "Success message", "default": "Resource refreshed", "x-component": "Input" },
    "unavailableMessage": { "type": "string", "title": "Unavailable message", "default": "No resource to refresh", "x-component": "Input" },
    "notifySuccess": { "type": "boolean", "title": "Notify on success", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-actions/confirm-action/index.ts',
    content: `const { Modal } = ctx.libs.antd;
const confirmed = await new Promise<boolean>((resolve) => {
  Modal.confirm({
    title: ctx.t(String(ctx.settings?.title || 'Confirm action')),
    content: ctx.t(String(ctx.settings?.content || 'Continue with this action?')),
    okText: ctx.t(String(ctx.settings?.confirmText || 'Continue')),
    cancelText: ctx.t(String(ctx.settings?.cancelText || 'Cancel')),
    onOk: () => resolve(true),
    onCancel: () => resolve(false),
  });
});

if (!confirmed) {
  return;
}

ctx.message.success(ctx.t(String(ctx.settings?.successMessage || 'Action confirmed')));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/confirm-action/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "confirm-action",
  "title": "Confirm action",
  "description": "Shows a configurable confirmation dialog before running an action.",
  "category": "examples",
  "tags": ["JS Action", "Confirmation"],
  "sort": 20,
  "settings": {
    "title": { "type": "string", "title": "Dialog title", "default": "Confirm action", "required": true, "x-component": "Input" },
    "content": { "type": "string", "title": "Dialog content", "default": "Continue with this action?", "x-component": "Input.TextArea" },
    "confirmText": { "type": "string", "title": "Confirm text", "default": "Continue", "x-component": "Input" },
    "cancelText": { "type": "string", "title": "Cancel text", "default": "Cancel", "x-component": "Input" },
    "successMessage": { "type": "string", "title": "Success message", "default": "Action confirmed", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/status-tag/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const rawValue = ctx.getValue?.() ?? ctx.value;
const status =
  rawValue == null || String(rawValue).trim() === ''
    ? String(ctx.settings?.emptyText || ctx.t('Unknown'))
    : String(rawValue);
const activeValue = String(ctx.settings?.activeValue || 'active');
const warningValue = String(ctx.settings?.warningValue || 'pending');
const color =
  status === activeValue
    ? String(ctx.settings?.activeColor || '#52c41a')
    : status === warningValue
      ? String(ctx.settings?.warningColor || '#faad14')
      : String(ctx.settings?.fallbackColor || '#8c8c8c');

ctx.render(<Tag color={color}>{ctx.t(status)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/status-tag/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "status-tag",
  "title": "Status tag",
  "description": "Renders a bound field value as a configurable Ant Design tag.",
  "category": "js-field",
  "tags": ["JS Field", "Display"],
  "sort": 10,
  "settings": {
    "activeValue": { "type": "string", "title": "Active value", "default": "active", "x-component": "Input" },
    "warningValue": { "type": "string", "title": "Warning value", "default": "pending", "x-component": "Input" },
    "activeColor": { "type": "string", "title": "Active color", "default": "#52c41a", "x-component": "ColorPicker" },
    "warningColor": { "type": "string", "title": "Warning color", "default": "#faad14", "x-component": "ColorPicker" },
    "fallbackColor": { "type": "string", "title": "Fallback color", "default": "#8c8c8c", "x-component": "ColorPicker" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "Unknown", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/editable-text/index.tsx',
    content: `const { Input } = ctx.libs.antd;
const useState = (
  ctx.libs.React as {
    useState(initialValue: string): [string, (nextValue: string) => void];
  }
).useState;
const initialValue = ctx.getValue?.() ?? ctx.value;

function EditableText() {
  const [value, setValue] = useState(initialValue == null ? '' : String(initialValue));
  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    ctx.setValue?.(nextValue);
  };

  return (
    <Input
      allowClear={ctx.settings?.allowClear !== false}
      value={value}
      maxLength={Number(ctx.settings?.maxLength ?? 80)}
      placeholder={ctx.t(String(ctx.settings?.placeholder || 'Enter a value'))}
      onChange={(event) => updateValue(event.target.value)}
      onBlur={(event) => {
        if (ctx.settings?.trimOnBlur !== false) {
          updateValue(event.target.value.trim());
        }
      }}
    />
  );
}

ctx.render(<EditableText />);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/editable-text/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "editable-text",
  "title": "Editable text",
  "description": "Renders an editable input and writes changes through ctx.setValue().",
  "category": "js-field",
  "tags": ["JS Field", "Form"],
  "sort": 20,
  "settings": {
    "placeholder": { "type": "string", "title": "Placeholder", "default": "Enter a value", "x-component": "Input" },
    "maxLength": { "type": "integer", "title": "Maximum length", "default": 80, "minimum": 1, "maximum": 500, "x-component": "InputNumber" },
    "allowClear": { "type": "boolean", "title": "Allow clear", "default": true, "x-component": "Switch" },
    "trimOnBlur": { "type": "boolean", "title": "Trim on blur", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/record-status-column/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const resolvedRecord = await ctx.getVar('ctx.record');
const record =
  resolvedRecord && typeof resolvedRecord === 'object' && !Array.isArray(resolvedRecord)
    ? (resolvedRecord as Record<string, unknown>)
    : {};
const fieldName = String(ctx.settings?.fieldName || 'status');
const status = String(record?.[fieldName] ?? ctx.settings?.emptyText ?? ctx.t('Unknown'));
const activeValue = String(ctx.settings?.activeValue || 'active');
const warningValue = String(ctx.settings?.warningValue || 'pending');
const color =
  status === activeValue
    ? String(ctx.settings?.activeColor || '#52c41a')
    : status === warningValue
      ? String(ctx.settings?.warningColor || '#faad14')
      : String(ctx.settings?.fallbackColor || '#8c8c8c');

ctx.render(<Tag color={color}>{ctx.t(status)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/record-status-column/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "record-status-column",
  "title": "Record status column",
  "description": "Standalone JS Column that reads a configurable field from the current table record.",
  "category": "js-column",
  "tags": ["JS Column", "Table"],
  "sort": 30,
  "settings": {
    "fieldName": { "type": "string", "title": "Status field", "default": "status", "required": true, "x-component": "Input" },
    "activeValue": { "type": "string", "title": "Active value", "default": "active", "x-component": "Input" },
    "warningValue": { "type": "string", "title": "Warning value", "default": "pending", "x-component": "Input" },
    "activeColor": { "type": "string", "title": "Active color", "default": "#52c41a", "x-component": "ColorPicker" },
    "warningColor": { "type": "string", "title": "Warning color", "default": "#faad14", "x-component": "ColorPicker" },
    "fallbackColor": { "type": "string", "title": "Fallback color", "default": "#8c8c8c", "x-component": "ColorPicker" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "Unknown", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/record-summary-column/index.tsx',
    content: `const { Space, Typography } = ctx.libs.antd;
const resolvedRecord = await ctx.getVar('ctx.record');
const record =
  resolvedRecord && typeof resolvedRecord === 'object' && !Array.isArray(resolvedRecord)
    ? (resolvedRecord as Record<string, unknown>)
    : {};
const primary = record?.[String(ctx.settings?.primaryField || 'title')];
const secondary = record?.[String(ctx.settings?.secondaryField || 'name')];
const parts = [primary, secondary]
  .filter((value) => value != null && String(value).trim() !== '')
  .map(String);
const text = parts.join(String(ctx.settings?.separator || ' · ')) || String(ctx.settings?.emptyText || '-');

ctx.render(
  <Space size={6}>
    <Typography.Text type="secondary">{ctx.t('Summary')}</Typography.Text>
    <Typography.Text ellipsis={{ tooltip: text }}>{text}</Typography.Text>
  </Space>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/record-summary-column/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "record-summary-column",
  "title": "Record summary column",
  "description": "Standalone JS Column that combines two configurable fields into one compact summary.",
  "category": "js-column",
  "tags": ["JS Column", "Table"],
  "sort": 40,
  "settings": {
    "primaryField": { "type": "string", "title": "Primary field", "default": "title", "required": true, "x-component": "Input" },
    "secondaryField": { "type": "string", "title": "Secondary field", "default": "name", "x-component": "Input" },
    "separator": { "type": "string", "title": "Separator", "default": " · ", "x-component": "Input" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "-", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-items/form-total-preview/index.tsx',
    content: `const { Card, Statistic } = ctx.libs.antd;
const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const quantityField = String(ctx.settings?.quantityField || 'quantity');
const unitPriceField = String(ctx.settings?.unitPriceField || 'unitPrice');
const quantity = Number(values?.[quantityField] || 0);
const unitPrice = Number(values?.[unitPriceField] || 0);

if (ctx.settings?.hideWhenEmpty === true && !quantity && !unitPrice) {
  ctx.render(null);
  return;
}

ctx.render(
  <Card size="small">
    <Statistic
      title={ctx.t('Calculated total')}
      value={quantity * unitPrice}
      precision={Number(ctx.settings?.precision ?? 2)}
      prefix={String(ctx.settings?.currency || 'USD')}
    />
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/form-total-preview/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "form-total-preview",
  "title": "Form total preview",
  "description": "Standalone form item that previews quantity multiplied by unit price.",
  "category": "js-item",
  "tags": ["JS Item", "Form"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" },
    "currency": { "type": "string", "title": "Currency", "default": "USD", "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" },
    "hideWhenEmpty": { "type": "boolean", "title": "Hide when empty", "default": false, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-items/selection-tools/index.tsx',
    content: `const { Button, Space } = ctx.libs.antd;
const { ReloadOutlined } = ctx.libs.antdIcons;

const inspect = () => {
  const rows = ctx.resource?.getSelectedRows?.() || [];
  if (!rows.length) {
    ctx.message.warning(ctx.t(String(ctx.settings?.noSelectionMessage || 'Please select records')));
    return;
  }
  ctx.message.info(ctx.t('Selected {{count}} rows', { count: rows.length }));
};

const refresh = async () => {
  if (!ctx.resource?.refresh) {
    ctx.message.warning(ctx.t('No resource to refresh'));
    return;
  }
  await ctx.resource.refresh();
  ctx.message.success(ctx.t(String(ctx.settings?.refreshedMessage || 'Resource refreshed')));
};

ctx.render(
  <Space.Compact>
    <Button onClick={inspect}>
      {ctx.t(String(ctx.settings?.inspectLabel || 'Inspect selection'))}
    </Button>
    <Button icon={<ReloadOutlined />} onClick={refresh}>
      {ctx.t(String(ctx.settings?.refreshLabel || 'Refresh'))}
    </Button>
  </Space.Compact>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/selection-tools/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "selection-tools",
  "title": "Selection tools",
  "description": "Custom action item with buttons for inspecting selected rows and refreshing data.",
  "category": "js-item",
  "tags": ["JS Item", "Action bar"],
  "sort": 20,
  "settings": {
    "inspectLabel": { "type": "string", "title": "Inspect label", "default": "Inspect selection", "x-component": "Input" },
    "refreshLabel": { "type": "string", "title": "Refresh label", "default": "Refresh", "x-component": "Input" },
    "noSelectionMessage": { "type": "string", "title": "No selection message", "default": "Please select records", "x-component": "Input" },
    "refreshedMessage": { "type": "string", "title": "Refreshed message", "default": "Resource refreshed", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/index.ts',
    content: `const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const quantity = Number(values?.[String(ctx.settings?.quantityField || 'quantity')] || 0);
const unitPrice = Number(values?.[String(ctx.settings?.unitPriceField || 'unitPrice')] || 0);
const precision = Number(ctx.settings?.precision ?? 2);

return Number((quantity * unitPrice).toFixed(precision));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "calculate-subtotal",
  "title": "Calculate subtotal",
  "description": "Value-return RunJS that multiplies two configurable form fields.",
  "category": "runjs",
  "tags": ["RunJS", "Form value"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/runjs/calculate-total-with-tax/index.ts',
    content: `const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const subtotal = Number(values?.[String(ctx.settings?.subtotalField || 'subtotal')] || 0);
const taxRate = Number(values?.[String(ctx.settings?.taxRateField || 'taxRate')] || 0);
const precision = Number(ctx.settings?.precision ?? 2);

return Number((subtotal + subtotal * taxRate).toFixed(precision));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/calculate-total-with-tax/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "calculate-total-with-tax",
  "title": "Calculate total with tax",
  "description": "Value-return RunJS that adds a configurable tax-rate field to a subtotal.",
  "category": "runjs",
  "tags": ["RunJS", "Form value"],
  "sort": 20,
  "settings": {
    "subtotalField": { "type": "string", "title": "Subtotal field", "default": "subtotal", "required": true, "x-component": "Input" },
    "taxRateField": { "type": "string", "title": "Tax rate field", "default": "taxRate", "required": true, "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" }
  }
}
`,
    language: 'json',
  },
];

export function createLightExtensionBaseTemplate(): LightExtensionTreeEntryInput[] {
  return BASE_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}

export function createDefaultLightExtensionTemplate(): LightExtensionTreeEntryInput[] {
  return DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}
