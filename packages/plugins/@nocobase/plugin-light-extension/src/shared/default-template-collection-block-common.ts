/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_COLLECTION_BLOCK_COMMON_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'src/shared/collection-block/types.ts',
    content: `export type JsonRecord = Record<string, unknown>;
export type PrimitiveOptionValue = string | number | boolean;
export type FormatterKey = 'text' | 'number' | 'date' | 'boolean' | 'relation' | 'json';
export type SortDirection = 'asc' | 'desc';
export type TemporalMode = 'date' | 'datetime' | 'datetimeNoTz' | 'time';

export type CollectionFieldLike = JsonRecord & {
  name?: string;
  title?: string;
  type?: string;
  interface?: string;
  target?: string;
  hidden?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  allowNull?: boolean;
  readonly?: boolean;
  inputable?: boolean;
  defaultValue?: unknown;
  targetCollectionTitleFieldName?: string;
  options?: JsonRecord;
  isAssociationField?: () => boolean;
};

export type CollectionLike = JsonRecord & {
  filterTargetKey?: string | string[];
  titleField?: string;
  options?: JsonRecord;
  getFields?: () => CollectionFieldLike[];
  getFilterByTK?: (record: JsonRecord) => unknown;
};

export type SelectOption = {
  label: string;
  value: PrimitiveOptionValue;
};

export type FieldMeta = {
  name: string;
  title: string;
  type: string;
  interfaceName: string;
  association: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  readOnly: boolean;
  required: boolean;
  multiple: boolean;
  formatter: FormatterKey;
  temporalMode?: TemporalMode;
  defaultValue?: unknown;
  targetTitleField?: string;
  options: SelectOption[];
};

export type FieldConfig = {
  field: string;
  scope: string;
  title?: string;
  visible: boolean;
};

export type CollectionRequest = {
  method: 'get';
  params: JsonRecord;
};

export type ResourceLike = {
  setDataSourceKey?: (key: string) => ResourceLike;
  setResourceName?: (name: string) => ResourceLike;
  runAction?: (action: string, options: JsonRecord) => Promise<unknown>;
};

export type MultiRecordResourceLike = ResourceLike;

export type PaginationState = {
  current: number;
  pageSize: number;
  total: number;
  totalKnown: boolean;
};

export type CollectionRequestBuilder = (page: number, pageSize: number) => CollectionRequest;

export type PersistState = {
  scope: string;
  flushScheduled: boolean;
  saving: boolean;
  revision: number;
  savedRevision: number;
  patch: JsonRecord;
};

export type CollectionBlockFlowModel = {
  uid: string;
  setTitle: (title: string) => void;
  flowEngine?: {
    getModel?: (uid: string) => unknown;
  };
  getStepParams: (flowKey: string, stepKey: string) => unknown;
  setStepParams: (flowKey: string, stepKey: string, params: JsonRecord) => void;
  saveStepParams: () => Promise<unknown>;
  __lightExtensionCollectionBlockPersistStates?: Record<string, PersistState>;
};

export type FlowModelLike = CollectionBlockFlowModel;

export type PersistenceContext = {
  message: { error: (message: string) => void };
  runJsSource?: unknown;
  t: (text: string) => string;
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/collection-utils.ts',
    content: `import type {
  CollectionFieldLike,
  CollectionLike,
  CollectionRequest,
  FieldConfig,
  FieldMeta,
  FormatterKey,
  JsonRecord,
  PrimitiveOptionValue,
  SelectOption,
  SortDirection,
  TemporalMode,
} from './types';

export const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const cloneJson = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

export const sameJson = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

export const readProperty = (value: unknown, key: string): unknown => {
  if (!isRecord(value)) return undefined;
  if (value[key] !== undefined) return value[key];
  return isRecord(value.options) ? value.options[key] : undefined;
};

export const toNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const toPositiveInteger = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};

const associationTypes = new Set(['belongsTo', 'belongsToMany', 'belongsToArray', 'hasOne', 'hasMany']);
const readOnlyInterfaceNames = new Set([
  'createdAt',
  'createdBy',
  'formula',
  'sequence',
  'updatedAt',
  'updatedBy',
]);

const resolveFormatter = (type: string, interfaceName: string, association: boolean): FormatterKey => {
  if (association) return 'relation';
  const signature = (interfaceName + ' ' + type).toLowerCase();
  if (signature.includes('bool') || signature.includes('checkbox') || signature.includes('switch')) return 'boolean';
  if (signature.includes('date') || signature.includes('time')) return 'date';
  if (/integer|number|decimal|double|float|percent/.test(signature)) return 'number';
  if (signature.includes('json')) return 'json';
  return 'text';
};

const resolveTemporalMode = (type: string, interfaceName: string): TemporalMode | undefined => {
  const normalizedInterface = interfaceName.toLowerCase();
  const normalizedType = type.toLowerCase();
  if (normalizedInterface === 'time' || normalizedType === 'time') return 'time';
  if (normalizedInterface === 'date' || normalizedType === 'date') return 'date';
  if (normalizedInterface === 'datetimenotz') return 'datetimeNoTz';
  if (
    normalizedInterface.includes('datetime') ||
    normalizedInterface.includes('timestamp') ||
    normalizedType.includes('datetime') ||
    normalizedType.includes('timestamp')
  ) {
    return 'datetime';
  }
  return undefined;
};

const toPrimitiveOptionValue = (value: unknown): PrimitiveOptionValue | undefined =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined;

const normalizeSelectOptions = (field: CollectionFieldLike): SelectOption[] => {
  const rawOptions = readProperty(field, 'enum');
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions.flatMap((item) => {
    if (isRecord(item)) {
      const value = toPrimitiveOptionValue(item.value);
      if (value === undefined) return [];
      return [{ label: String(item.label ?? item.title ?? value), value }];
    }
    const value = toPrimitiveOptionValue(item);
    return value === undefined ? [] : [{ label: String(value), value }];
  });
};

const isAssociationField = (field: CollectionFieldLike, type: string): boolean =>
  (typeof field.isAssociationField === 'function' && field.isAssociationField()) ||
  Boolean(toNonEmptyString(readProperty(field, 'target'))) ||
  associationTypes.has(type);

export const getCollectionFields = (
  collection: CollectionLike,
  translate: (text: string) => string,
): FieldMeta[] => {
  const fields = typeof collection.getFields === 'function' ? collection.getFields() : [];
  return fields.flatMap((field) => {
    const name = toNonEmptyString(readProperty(field, 'name'));
    const interfaceName = toNonEmptyString(readProperty(field, 'interface'));
    const type = toNonEmptyString(readProperty(field, 'type')) || '';
    const signature = (interfaceName + ' ' + type).toLowerCase();
    if (!name || !interfaceName || readProperty(field, 'hidden') === true || signature.includes('password')) {
      return [];
    }
    const association = isAssociationField(field, type);
    const primaryKey = readProperty(field, 'primaryKey') === true;
    const autoIncrement = readProperty(field, 'autoIncrement') === true;
    const readOnly =
      readProperty(field, 'readonly') === true ||
      readProperty(field, 'readOnly') === true ||
      readProperty(field, 'disabled') === true ||
      readProperty(field, 'inputable') === false ||
      readOnlyInterfaceNames.has(interfaceName) ||
      ['context', 'virtual'].includes(type);
    const allowNull = readProperty(field, 'allowNull');
    const required = readProperty(field, 'required') === true || allowNull === false;
    const multiple =
      type === 'array' ||
      type === 'set' ||
      interfaceName.toLowerCase().includes('multiple') ||
      interfaceName.toLowerCase().includes('checkboxgroup');
    return [
      {
        name,
        title: translate(String(readProperty(field, 'title') || name)),
        type,
        interfaceName,
        association,
        primaryKey,
        autoIncrement,
        readOnly,
        required,
        multiple,
        formatter: resolveFormatter(type, interfaceName, association),
        temporalMode: resolveTemporalMode(type, interfaceName),
        defaultValue: cloneJson(readProperty(field, 'defaultValue')),
        targetTitleField: toNonEmptyString(readProperty(field, 'targetCollectionTitleFieldName')),
        options: normalizeSelectOptions(field),
      },
    ];
  });
};

export const getWritableFields = (fields: FieldMeta[], primaryKeys: string[] = []): FieldMeta[] => {
  const primaryKeySet = new Set(primaryKeys);
  return fields.filter(
    (field) =>
      !field.association &&
      !field.primaryKey &&
      !primaryKeySet.has(field.name) &&
      !field.autoIncrement &&
      !field.readOnly,
  );
};

export const getPrimaryKeys = (collection: CollectionLike): string[] => {
  const rawValue = readProperty(collection, 'filterTargetKey');
  const keys = (Array.isArray(rawValue) ? rawValue : [rawValue]).flatMap((value) => {
    const key = toNonEmptyString(value);
    return key ? [key] : [];
  });
  return keys.length ? Array.from(new Set(keys)) : ['id'];
};

export const getCollectionString = (collection: CollectionLike, key: string): string | undefined =>
  toNonEmptyString(readProperty(collection, key));

export const getTitleField = (collection: CollectionLike): string | undefined =>
  getCollectionString(collection, 'titleField');

export const getVisibleFields = (
  fieldConfigs: FieldConfig[],
  fieldMap: Map<string, FieldMeta>,
): FieldMeta[] =>
  fieldConfigs
    .filter((config) => config.visible)
    .map((config) => fieldMap.get(config.field))
    .filter((field): field is FieldMeta => Boolean(field));

export const normalizeFieldConfigs = (
  fields: FieldMeta[],
  rawConfigs: unknown,
  primaryKeys: string[],
  titleField: string | undefined,
  scope: string,
  maxInitial: number,
): FieldConfig[] => {
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  const output: FieldConfig[] = [];
  const used = new Set<string>();
  const savedConfigs = Array.isArray(rawConfigs) ? rawConfigs : [];

  for (const rawConfig of savedConfigs) {
    if (!isRecord(rawConfig)) continue;
    const savedScope = toNonEmptyString(rawConfig.scope);
    if (savedScope && savedScope !== scope) continue;
    const fieldName = toNonEmptyString(rawConfig.field);
    if (!fieldName || !fieldMap.has(fieldName) || used.has(fieldName)) continue;
    output.push({ field: fieldName, scope, visible: rawConfig.visible !== false });
    used.add(fieldName);
  }

  const preferredNames = [...primaryKeys, titleField].filter(
    (name, index, names): name is string => Boolean(name) && names.indexOf(name) === index,
  );
  const orderedFields = [
    ...preferredNames.map((name) => fieldMap.get(name)).filter((field): field is FieldMeta => Boolean(field)),
    ...fields.filter((field) => !preferredNames.includes(field.name)),
  ];
  const hasSavedConfigs = output.length > 0;

  for (const field of orderedFields) {
    if (used.has(field.name)) continue;
    output.push({
      field: field.name,
      scope,
      visible: !hasSavedConfigs && output.length < Math.max(1, maxInitial),
    });
    used.add(field.name);
  }

  if (output.length && !output.some((config) => config.visible)) {
    output[0] = { ...output[0], visible: true };
  }

  return output;
};

export const buildCollectionRequest = ({
  page,
  pageSize,
  fieldConfigs,
  fieldMap,
  primaryKeys,
  sortField,
  sortDirection,
}: {
  page: number;
  pageSize: number;
  fieldConfigs: FieldConfig[];
  fieldMap: Map<string, FieldMeta>;
  primaryKeys: string[];
  sortField?: string;
  sortDirection?: SortDirection;
}): CollectionRequest => {
  const visibleFields = getVisibleFields(fieldConfigs, fieldMap);
  const fields = Array.from(
    new Set([...primaryKeys, ...visibleFields.filter((field) => !field.association).map((field) => field.name)]),
  );
  const appends = Array.from(
    new Set(visibleFields.filter((field) => field.association).map((field) => field.name)),
  );
  const params: JsonRecord = { page, pageSize, fields };
  if (appends.length) params.appends = appends;
  if (sortField && fieldMap.has(sortField)) {
    params.sort = [sortDirection === 'desc' ? '-' + sortField : sortField];
  }
  return { method: 'get', params };
};

const isConfiguredRecordId = (value: unknown): boolean =>
  value !== undefined && value !== null && (typeof value !== 'string' || Boolean(value.trim()));

export const resolveRecordId = (
  configuredValue: unknown,
  collection: CollectionLike,
  record: unknown,
): unknown => {
  if (isConfiguredRecordId(configuredValue)) return configuredValue;
  if (!isRecord(record)) return undefined;
  if (typeof collection.getFilterByTK === 'function') {
    const filterByTk = collection.getFilterByTK(record);
    if (isConfiguredRecordId(filterByTk)) return filterByTk;
  }
  const primaryKeys = getPrimaryKeys(collection);
  if (primaryKeys.length === 1) return record[primaryKeys[0]];
  const output: JsonRecord = {};
  for (const key of primaryKeys) {
    if (record[key] === undefined) return undefined;
    output[key] = record[key];
  }
  return output;
};

export const unwrapActionData = (result: unknown): unknown => (isRecord(result) && 'data' in result ? result.data : result);

export const prepareFormRecord = (
  record: unknown,
  fields: FieldMeta[],
  primaryKeys: string[] = [],
): JsonRecord => {
  if (!isRecord(record)) return {};
  const output: JsonRecord = {};
  for (const field of getWritableFields(fields, primaryKeys)) {
    const value = record[field.name];
    if (value === undefined) continue;
    output[field.name] = cloneJson(value);
  }
  return output;
};

export const prepareCreateFormRecord = (fields: FieldMeta[], primaryKeys: string[] = []): JsonRecord => {
  const output: JsonRecord = {};
  for (const field of getWritableFields(fields, primaryKeys)) {
    if (field.defaultValue === undefined) continue;
    output[field.name] = cloneJson(field.defaultValue);
  }
  return output;
};

const normalizeTemporalValue = (value: unknown, field: FieldMeta): unknown => {
  if (!value || typeof value !== 'object') return value;
  const candidate = value as { format?: (format: string) => string; toISOString?: () => string };
  if (field.temporalMode === 'time' && typeof candidate.format === 'function') {
    return candidate.format('HH:mm:ss');
  }
  if (field.temporalMode === 'date' && typeof candidate.format === 'function') {
    return candidate.format('YYYY-MM-DD');
  }
  if (field.temporalMode === 'datetimeNoTz' && typeof candidate.format === 'function') {
    return candidate.format('YYYY-MM-DD HH:mm:ss');
  }
  return typeof candidate.toISOString === 'function' ? candidate.toISOString() : value;
};

export const normalizeFormValues = (
  values: unknown,
  fields: FieldMeta[],
  primaryKeys: string[] = [],
): JsonRecord => {
  if (!isRecord(values)) return {};
  const output: JsonRecord = {};
  for (const field of getWritableFields(fields, primaryKeys)) {
    if (values[field.name] === undefined) continue;
    const value = values[field.name];
    if (field.formatter === 'date') {
      output[field.name] = normalizeTemporalValue(value, field);
      continue;
    }
    if (field.formatter === 'json' && typeof value === 'string') {
      try {
        output[field.name] = value.trim() ? JSON.parse(value) : null;
      } catch {
        output[field.name] = value;
      }
      continue;
    }
    output[field.name] = cloneJson(value);
  }
  return output;
};

export const valueToText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.map(valueToText).join(', ');
  if (isRecord(value)) {
    const candidate = value.title ?? value.name ?? value.nickname ?? value.username ?? value.id;
    return candidate === undefined ? JSON.stringify(value) : valueToText(candidate);
  }
  return String(value);
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/settings-persistence.ts',
    content: `import { cloneJson, isRecord, sameJson, toNonEmptyString } from './collection-utils';
import type { CollectionBlockFlowModel, JsonRecord, PersistState, PersistenceContext } from './types';

type CreateCollectionBlockSettingsPersistenceOptions = {
  blockKey: string;
  configurable: boolean;
  ctx: PersistenceContext;
  flowModel: CollectionBlockFlowModel;
  settings: JsonRecord;
};

export const createCollectionBlockSettingsPersistence = ({
  blockKey,
  configurable,
  ctx,
  flowModel,
  settings,
}: CreateCollectionBlockSettingsPersistenceOptions) => {
  const getSourceIdentity = (runJs: JsonRecord): string => {
    const sourceBinding = isRecord(runJs.sourceBinding) ? runJs.sourceBinding : {};
    return [runJs.sourceMode, sourceBinding.type, sourceBinding.repoId, sourceBinding.entryId, sourceBinding.kind]
      .map((value) => String(value || ''))
      .join(':');
  };
  const buildPersistScope = (runJs: JsonRecord, runSettings: JsonRecord): string =>
    [
      blockKey,
      toNonEmptyString(runSettings.dataSourceKey) || 'main',
      toNonEmptyString(runSettings.collectionName) || '',
      getSourceIdentity(runJs),
    ].join('|');
  const initialRunJsValue = flowModel.getStepParams('jsSettings', 'runJs');
  const initialRunJs = isRecord(initialRunJsValue) ? initialRunJsValue : {};
  const sourceInfo = isRecord(ctx.runJsSource) ? ctx.runJsSource : {};
  const runJsForScope = isRecord(initialRunJs.sourceBinding)
    ? initialRunJs
    : {
        ...initialRunJs,
        sourceMode: initialRunJs.sourceMode || sourceInfo.sourceMode,
        sourceBinding: sourceInfo.sourceBinding,
      };
  const persistScope = buildPersistScope(runJsForScope, settings);

  const getStateMap = (): Record<string, PersistState> => {
    if (!flowModel.__lightExtensionCollectionBlockPersistStates) {
      flowModel.__lightExtensionCollectionBlockPersistStates = {};
    }
    return flowModel.__lightExtensionCollectionBlockPersistStates;
  };
  const getPersistState = (): PersistState => {
    const stateMap = getStateMap();
    const current = stateMap[blockKey];
    if (!current || current.scope !== persistScope) {
      stateMap[blockKey] = {
        scope: persistScope,
        flushScheduled: false,
        saving: false,
        revision: 0,
        savedRevision: 0,
        patch: {},
      };
    }
    return stateMap[blockKey];
  };
  const persistState = getPersistState();

  const isCurrentState = (state: PersistState): boolean => getStateMap()[blockKey] === state;
  const isFlowModelActive = (): boolean => {
    const getModel = flowModel.flowEngine?.getModel;
    return typeof getModel !== 'function' || getModel(flowModel.uid) === flowModel;
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
  const reportError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    ctx.message.error(ctx.t('Failed to save block configuration') + ': ' + message);
  };

  const flushPatch = async (state: PersistState) => {
    if (!isCurrentState(state) || !isFlowModelActive() || state.saving || state.savedRevision >= state.revision) {
      return;
    }
    state.saving = true;
    let failed = false;
    try {
      while (isCurrentState(state) && isFlowModelActive() && state.savedRevision < state.revision) {
        const targetRevision = state.revision;
        const patch = cloneJson(state.patch);
        const runJsValue = flowModel.getStepParams('jsSettings', 'runJs');
        const runJs = isRecord(runJsValue) ? runJsValue : {};
        const currentSettings = isRecord(runJs.settings) ? runJs.settings : {};
        if (buildPersistScope(runJs, currentSettings) !== state.scope) {
          state.savedRevision = state.revision;
          state.patch = {};
          break;
        }
        const nextSettings = { ...currentSettings, ...patch };
        if (!sameJson(currentSettings, nextSettings)) {
          flowModel.setStepParams('jsSettings', 'runJs', { settings: nextSettings });
          await saveStableStepParams();
          if (!isCurrentState(state) || !isFlowModelActive()) break;
        }
        state.savedRevision = targetRevision;
      }
      state.patch = {};
    } catch (error) {
      failed = true;
      reportError(error);
    } finally {
      state.saving = false;
      if (!failed && isCurrentState(state) && isFlowModelActive() && state.savedRevision < state.revision) {
        flushPatch(state).catch(reportError);
      }
    }
  };

  return (patch: JsonRecord) => {
    if (!configurable || !isCurrentState(persistState) || !isFlowModelActive()) return;
    persistState.patch = { ...persistState.patch, ...cloneJson(patch) };
    persistState.revision += 1;
    if (persistState.flushScheduled) return;
    persistState.flushScheduled = true;
    Promise.resolve()
      .then(() => {
        persistState.flushScheduled = false;
        return flushPatch(persistState);
      })
      .catch(reportError);
  };
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/FieldManager.tsx',
    content: `import type { FieldConfig, FieldMeta, JsonRecord } from './types';

type CreateFieldManagerOptions = {
  React: typeof ctx.libs.React;
  antd?: typeof ctx.libs.antd;
  antdIcons?: typeof ctx.libs.antdIcons;
  configurable?: boolean;
  scheduleSettingsPatch?: (patch: JsonRecord) => void;
  settingKey?: string;
  t: (text: string) => string;
  Button?: typeof ctx.libs.antd.Button;
  Checkbox?: typeof ctx.libs.antd.Checkbox;
  Popover?: typeof ctx.libs.antd.Popover;
  Space?: typeof ctx.libs.antd.Space;
  Typography?: typeof ctx.libs.antd.Typography;
  ArrowDownOutlined?: typeof ctx.libs.antdIcons.ArrowDownOutlined;
  ArrowUpOutlined?: typeof ctx.libs.antdIcons.ArrowUpOutlined;
  DownOutlined?: typeof ctx.libs.antdIcons.DownOutlined;
  SettingOutlined?: typeof ctx.libs.antdIcons.SettingOutlined;
  UpOutlined?: typeof ctx.libs.antdIcons.UpOutlined;
};

type FieldManagerProps = {
  fields: FieldConfig[];
  fieldMap: Map<string, FieldMeta>;
  onChange: (fields: FieldConfig[]) => void;
};

export const createFieldManager = (options: CreateFieldManagerOptions) => {
  const { React, settingKey = 'fields', t } = options;
  const Button = options.antd?.Button || options.Button;
  const Checkbox = options.antd?.Checkbox || options.Checkbox;
  const Popover = options.antd?.Popover || options.Popover;
  const Space = options.antd?.Space || options.Space;
  const Typography = options.antd?.Typography || options.Typography;
  const DownIcon = options.antdIcons?.DownOutlined || options.DownOutlined || options.ArrowDownOutlined;
  const SettingIcon = options.antdIcons?.SettingOutlined || options.SettingOutlined;
  const UpIcon = options.antdIcons?.UpOutlined || options.UpOutlined || options.ArrowUpOutlined;
  const configurable = options.configurable !== false;

  const FieldManager = ({ fields, fieldMap, onChange }: FieldManagerProps) => {
    if (!configurable || !Checkbox || !Space || !Typography) return null;

    const commit = (nextFields: FieldConfig[]) => {
      onChange(nextFields);
      options.scheduleSettingsPatch?.({ [settingKey]: nextFields });
    };
    const setVisible = (fieldName: string, visible: boolean) => {
      const current = fields.find((field) => field.field === fieldName);
      const visibleCount = fields.filter((field) => field.visible).length;
      if (current?.visible && !visible && visibleCount <= 1) return;
      commit(fields.map((field) => (field.field === fieldName ? { ...field, visible } : field)));
    };
    const move = (index: number, offset: -1 | 1) => {
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= fields.length) return;
      const nextFields = [...fields];
      const [moved] = nextFields.splice(index, 1);
      if (!moved) return;
      nextFields.splice(targetIndex, 0, moved);
      commit(nextFields);
    };

    const visibleCount = fields.filter((field) => field.visible).length;
    const content = (
      <Space direction="vertical" size={4} style={{ minWidth: 260, maxHeight: 360, overflowY: 'auto' }}>
        {fields.map((field, index) => {
          const title = fieldMap.get(field.field)?.title || field.field;
          const isLastVisibleField = field.visible && visibleCount <= 1;
          return (
            <div
              key={field.field}
              style={{ alignItems: 'center', display: 'flex', gap: 6, justifyContent: 'space-between' }}
            >
              <Checkbox
                checked={field.visible}
                disabled={isLastVisibleField}
                onChange={(event) => setVisible(field.field, event.target.checked)}
              >
                <Typography.Text ellipsis={{ tooltip: title }} style={{ maxWidth: 150 }}>
                  {title}
                </Typography.Text>
              </Checkbox>
              <Space.Compact>
                {Button ? (
                  <>
                    <Button
                      aria-label={t('Move field up') + ': ' + title}
                      disabled={index === 0}
                      icon={UpIcon ? <UpIcon /> : undefined}
                      size="small"
                      type="text"
                      onClick={() => move(index, -1)}
                    >
                      {UpIcon ? null : '↑'}
                    </Button>
                    <Button
                      aria-label={t('Move field down') + ': ' + title}
                      disabled={index === fields.length - 1}
                      icon={DownIcon ? <DownIcon /> : undefined}
                      size="small"
                      type="text"
                      onClick={() => move(index, 1)}
                    >
                      {DownIcon ? null : '↓'}
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      aria-label={t('Move field up') + ': ' + title}
                      disabled={index === 0}
                      type="button"
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={t('Move field down') + ': ' + title}
                      disabled={index === fields.length - 1}
                      type="button"
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </button>
                  </>
                )}
              </Space.Compact>
            </div>
          );
        })}
      </Space>
    );

    return Button && Popover ? (
      <Popover content={content} placement="bottomRight" trigger="click">
        <Button icon={SettingIcon ? <SettingIcon /> : undefined}>{t('Fields')}</Button>
      </Popover>
    ) : content;
  };

  return FieldManager;
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/DisplayValue.tsx',
    content: `import { isRecord, valueToText } from './collection-utils';
import type { FieldConfig, FieldMeta } from './types';

type DisplayValueProps = {
  field: FieldMeta;
  value: unknown;
};

type CreateDisplayValueRendererOptions = {
  React: typeof ctx.libs.React;
  Tag: typeof ctx.libs.antd.Tag;
  Typography: typeof ctx.libs.antd.Typography;
  dayjs: typeof ctx.libs.dayjs;
  locale: string;
  t: (text: string) => string;
};

export const createDisplayValueRenderer = ({
  React,
  Tag,
  Typography,
  dayjs,
  locale,
  t,
}: CreateDisplayValueRendererOptions) => (_config: FieldConfig, field: FieldMeta, value: unknown) => {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  const optionValueToText = (candidate: unknown): string => {
    const option = field.options.find(
      (item) => Object.is(item.value, candidate) || String(item.value) === String(candidate),
    );
    return option?.label || valueToText(candidate);
  };
  const relationValueToText = (candidate: unknown): string => {
    if (isRecord(candidate) && field.targetTitleField && candidate[field.targetTitleField] !== undefined) {
      return valueToText(candidate[field.targetTitleField]);
    }
    return valueToText(candidate);
  };
  const optionText = field.options.length
    ? (Array.isArray(value) ? value : [value]).map(optionValueToText).join(', ')
    : undefined;
  const relationText = field.association
    ? (Array.isArray(value) ? value : [value]).map(relationValueToText).join(', ')
    : undefined;
  if (field.formatter === 'boolean') {
    const checked =
      value === true || value === 1 || value === '1' || (typeof value === 'string' && value.toLowerCase() === 'true');
    return <Tag color={checked ? 'success' : 'default'}>{optionText || (checked ? t('Yes') : t('No'))}</Tag>;
  }

  let text = optionText || relationText || valueToText(value);
  if (!optionText && !relationText && field.formatter === 'number') {
    const numberValue = typeof value === 'number' ? value : Number(value);
    text = Number.isFinite(numberValue) ? new Intl.NumberFormat(locale).format(numberValue) : '-';
  } else if (!optionText && !relationText && field.formatter === 'date') {
    if (field.temporalMode === 'time' && typeof value === 'string') {
      text = value;
    } else {
      const dateValue = dayjs(value as string | number | Date);
      const format =
        field.temporalMode === 'date'
          ? 'YYYY-MM-DD'
          : field.temporalMode === 'datetimeNoTz'
            ? 'YYYY-MM-DD HH:mm:ss'
            : field.temporalMode === 'time'
              ? 'HH:mm:ss'
              : 'YYYY-MM-DD HH:mm';
      text = dateValue?.isValid?.() ? dateValue.format(format) : '-';
    }
  } else if (!optionText && !relationText && field.formatter === 'json') {
    try {
      text = JSON.stringify(value);
    } catch {
      text = isRecord(value) ? valueToText(value) : String(value);
    }
  }

  return (
    <Typography.Text
      code={field.formatter === 'json'}
      ellipsis={{ tooltip: text }}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {text}
    </Typography.Text>
  );
};

export const DisplayValue = ({ field, value }: DisplayValueProps) => {
  const React = ctx.libs.React;
  const renderValue = createDisplayValueRenderer({
    React,
    Tag: ctx.libs.antd.Tag,
    Typography: ctx.libs.antd.Typography,
    dayjs: ctx.libs.dayjs,
    locale: ctx.locale,
    t: (text) => ctx.t(text),
  });
  return renderValue({ field: field.name, scope: '', visible: true }, field, value);
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/FormField.tsx',
    content: `import type { FieldMeta } from './types';

type FormFieldProps = {
  disabled?: boolean;
  field: FieldMeta;
};

type CreateFormFieldRendererOptions = {
  React: typeof ctx.libs.React;
  Form: typeof ctx.libs.antd.Form;
  Input: typeof ctx.libs.antd.Input;
  InputNumber: typeof ctx.libs.antd.InputNumber;
  Select: typeof ctx.libs.antd.Select;
  Switch: typeof ctx.libs.antd.Switch;
  DatePicker: typeof ctx.libs.antd.DatePicker;
  TimePicker: typeof ctx.libs.antd.TimePicker;
  t: (text: string) => string;
};

const toTemporalPickerValue = (
  value: unknown,
  field: FieldMeta,
  dayjs: typeof ctx.libs.dayjs,
): unknown => {
  if (value === null || value === undefined || value === '') return null;
  const candidate =
    field.temporalMode === 'time' && typeof value === 'string' && !value.includes('T')
      ? dayjs('1970-01-01T' + value)
      : dayjs(value as string | number | Date);
  return candidate?.isValid?.() ? candidate : null;
};

export const createFormFieldRenderer = (options: CreateFormFieldRendererOptions) => {
  const { React, DatePicker, Input, InputNumber, Select, Switch, TimePicker } = options;
  return (field: FieldMeta, disabled = false) => {
    if (field.formatter === 'boolean') {
      return <Switch aria-label={field.title} disabled={disabled} />;
    }
    if (field.options.length) {
      return (
        <Select
          aria-label={field.title}
          allowClear={!field.required}
          disabled={disabled}
          mode={field.multiple ? 'multiple' : undefined}
          options={field.options}
          optionFilterProp="label"
          showSearch
        />
      );
    }
    if (field.formatter === 'number') {
      return <InputNumber aria-label={field.title} disabled={disabled} style={{ width: '100%' }} />;
    }
    if (field.formatter === 'date') {
      if (field.temporalMode === 'time') {
        return <TimePicker aria-label={field.title} disabled={disabled} format="HH:mm:ss" style={{ width: '100%' }} />;
      }
      return (
        <DatePicker
          aria-label={field.title}
          disabled={disabled}
          format={field.temporalMode === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'}
          showTime={field.temporalMode !== 'date'}
          style={{ width: '100%' }}
        />
      );
    }
    if (field.formatter === 'json') {
      return <Input.TextArea aria-label={field.title} autoSize={{ minRows: 3, maxRows: 8 }} disabled={disabled} />;
    }
    const signature = (field.interfaceName + ' ' + field.type).toLowerCase();
    if (
      signature.includes('textarea') ||
      signature.includes('richtext') ||
      signature.includes('markdown') ||
      field.type === 'text'
    ) {
      return <Input.TextArea aria-label={field.title} autoSize={{ minRows: 2, maxRows: 6 }} disabled={disabled} />;
    }
    return <Input aria-label={field.title} disabled={disabled} />;
  };
};

export const FormField = ({ disabled, field }: FormFieldProps) => {
  const React = ctx.libs.React;
  const { DatePicker, Form, Input, InputNumber, Select, Switch, TimePicker } = ctx.libs.antd;
  const dayjs = ctx.libs.dayjs;
  const renderField = createFormFieldRenderer({
    React,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    TimePicker,
    t: (text) => ctx.t(text),
  });
  const rules = field.required ? [{ required: true, message: ctx.t('This field is required') }] : undefined;
  const itemProps = {
    label: field.title,
    name: field.name,
    rules,
  };

  if (field.formatter === 'boolean') {
    return (
      <Form.Item {...itemProps} valuePropName="checked">
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  if (field.options.length) {
    return (
      <Form.Item {...itemProps}>
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  if (field.formatter === 'number') {
    return (
      <Form.Item {...itemProps}>
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  if (field.formatter === 'date') {
    return (
      <Form.Item
        {...itemProps}
        getValueProps={(value: unknown) => ({ value: toTemporalPickerValue(value, field, dayjs) })}
      >
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  if (field.formatter === 'json') {
    return (
      <Form.Item
        {...itemProps}
        getValueProps={(value: unknown) => ({
          value: typeof value === 'string' ? value : value === undefined ? '' : JSON.stringify(value, null, 2),
        })}
      >
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  const signature = (field.interfaceName + ' ' + field.type).toLowerCase();
  if (signature.includes('textarea') || signature.includes('richtext') || signature.includes('markdown') || field.type === 'text') {
    return (
      <Form.Item {...itemProps}>
        {renderField(field, disabled)}
      </Form.Item>
    );
  }
  return (
    <Form.Item {...itemProps}>
      {renderField(field, disabled)}
    </Form.Item>
  );
};
`,
    language: 'typescript',
  },
  {
    path: 'src/shared/collection-block/useCollectionRecords.ts',
    content: `import { isRecord, toPositiveInteger } from './collection-utils';
import type {
  CollectionRequestBuilder,
  JsonRecord,
  MultiRecordResourceLike,
  PaginationState,
} from './types';

type UseCollectionRecordsOptions = {
  React: typeof ctx.libs.React;
  resource: MultiRecordResourceLike;
  buildRequest: CollectionRequestBuilder;
  pageSize: number;
  t: (text: string) => string;
};

export const useCollectionRecords = ({
  React,
  resource,
  buildRequest,
  pageSize,
  t,
}: UseCollectionRecordsOptions) => {
  const mountedRef = React.useRef(true);
  const requestRevisionRef = React.useRef(0);
  const paginationRef = React.useRef<PaginationState>({
    current: 1,
    pageSize,
    total: 0,
    totalKnown: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>(paginationRef.current);
  const [rows, setRows] = React.useState<JsonRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [runtimeError, setRuntimeError] = React.useState<string | null>(null);

  const syncPagination = (nextPagination: PaginationState) => {
    paginationRef.current = nextPagination;
    setPagination(nextPagination);
  };

  const loadRecords = async (nextPage: number, nextPageSize: number) => {
    const requestRevision = requestRevisionRef.current + 1;
    requestRevisionRef.current = requestRevision;
    if (mountedRef.current) {
      setLoading(true);
      setRuntimeError(null);
    }
    if (typeof resource.runAction !== 'function') {
      if (mountedRef.current) {
        setRuntimeError(t('Unable to initialize collection resource'));
        setLoading(false);
      }
      return;
    }

    try {
      const result = await resource.runAction('list', buildRequest(nextPage, nextPageSize));
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

  const refresh = async () => {
    await loadRecords(paginationRef.current.current, paginationRef.current.pageSize);
  };

  React.useEffect(() => {
    mountedRef.current = true;
    loadRecords(1, pageSize);
    return () => {
      mountedRef.current = false;
      requestRevisionRef.current += 1;
    };
  }, []);

  return {
    loadRecords,
    loadRows: loadRecords,
    loading,
    mountedRef,
    pagination,
    paginationRef,
    refresh,
    rows,
    runtimeError,
    syncPagination,
  };
};
`,
    language: 'typescript',
  },
];
