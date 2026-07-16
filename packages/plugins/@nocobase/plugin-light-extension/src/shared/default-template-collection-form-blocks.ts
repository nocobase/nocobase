/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_COLLECTION_FORM_BLOCK_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'src/client/js-blocks/create-form/index.tsx',
    content: `import { mountCreateForm } from './CreateForm';

const { Alert } = ctx.libs.antd;
ctx.render(<Alert type="info" showIcon message={ctx.t('Loading add form')} />);
await mountCreateForm();
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/create-form/CreateForm.tsx',
    content: `import { createFieldManager } from '../../../shared/collection-block/FieldManager';
import { FormField } from '../../../shared/collection-block/FormField';
import {
  getCollectionFields,
  getPrimaryKeys,
  getTitleField,
  getVisibleFields,
  getWritableFields,
  normalizeFieldConfigs,
  normalizeFormValues,
  prepareCreateFormRecord,
  toNonEmptyString,
  toPositiveInteger,
  unwrapActionData,
} from '../../../shared/collection-block/collection-utils';
import { createCollectionBlockSettingsPersistence } from '../../../shared/collection-block/settings-persistence';
import type {
  CollectionBlockFlowModel,
  CollectionLike,
  FieldConfig,
  FieldMeta,
  JsonRecord,
  ResourceLike,
} from '../../../shared/collection-block/types';

type CollectionRuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

async function runCreateForm() {
  const React = ctx.libs.React;
  const antd = ctx.libs.antd;
  const {
    Alert,
    Button,
    Form,
    Space,
    Spin,
    Typography,
    theme,
  } = antd;
  const antdIcons = ctx.libs.antdIcons;
  const { SaveOutlined, UndoOutlined } = antdIcons;
  const settings = ctx.settings as JsonRecord;
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName);
  const formColumns = toPositiveInteger(settings.columns, 2, 1, 4);
  const maxInitialFields = toPositiveInteger(settings.maxInitialFields, 8, 1, 30);
  const flowModel = ctx.model as unknown as CollectionBlockFlowModel;
  const runtimeContext = ctx as unknown as CollectionRuntimeContext;
  const configurable = Boolean(runtimeContext.flowSettingsEnabled);
  flowModel.setTitle(collectionName ? ctx.t('JS Add Form') + ': ' + collectionName : ctx.t('JS Add Form'));

  if (!collectionName) {
    ctx.render(
      <Alert
        type="info"
        showIcon
        message={ctx.t('Select a collection')}
        description={ctx.t('Open the block settings and choose the collection used by this form.')}
      />,
    );
    return;
  }

  const collection = runtimeContext.dataSourceManager?.getCollection?.(dataSourceKey, collectionName);
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

  const collectionFields = getCollectionFields(collection, (text: string) => ctx.t(text));
  const primaryKeys = getPrimaryKeys(collection);
  const fields = getWritableFields(collectionFields, primaryKeys);
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No editable fields are available')} />);
    return;
  }

  const titleField = getTitleField(collection);
  const fieldMap = new Map(fields.map((field: FieldMeta) => [field.name, field]));
  const fieldScope = dataSourceKey + ':' + collectionName + ':create';
  const initialFieldConfigs = normalizeFieldConfigs(
    fields,
    settings.fields,
    primaryKeys,
    titleField,
    fieldScope,
    maxInitialFields,
  );
  const resource = ctx.makeResource('SingleRecordResource') as unknown as ResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);
  const scheduleSettingsPatch = createCollectionBlockSettingsPersistence({
    blockKey: 'create-form',
    configurable,
    ctx,
    flowModel,
    settings,
  });
  const FieldManager = createFieldManager({
    React,
    antd,
    antdIcons,
    configurable,
    scheduleSettingsPatch,
    t: (text: string) => ctx.t(text),
  });

  const CreateFormView = () => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const fieldConfigsRef = React.useRef<FieldConfig[]>(initialFieldConfigs);
    const [fieldConfigs, setFieldConfigs] = React.useState<FieldConfig[]>(initialFieldConfigs);
    const [submitting, setSubmitting] = React.useState(false);
    const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
    const visibleFields = React.useMemo(
      () => getVisibleFields(fieldConfigs, fieldMap),
      [fieldConfigs],
    );

    const syncFieldConfigs = (nextConfigs: FieldConfig[]) => {
      fieldConfigsRef.current = nextConfigs;
      setFieldConfigs(nextConfigs);
    };

    const resetForm = () => {
      const nextFields = getVisibleFields(fieldConfigsRef.current, fieldMap);
      form.resetFields();
      form.setFieldsValue(prepareCreateFormRecord(nextFields, primaryKeys));
      setRuntimeError(null);
    };

    const submitForm = async (values: JsonRecord) => {
      if (typeof resource.runAction !== 'function') {
        setRuntimeError(ctx.t('Unable to initialize collection resource'));
        return;
      }
      setSubmitting(true);
      setRuntimeError(null);
      try {
        const currentFields = getVisibleFields(fieldConfigsRef.current, fieldMap);
        const normalizedValues = normalizeFormValues(values, currentFields, primaryKeys);
        const result = await resource.runAction('create', { data: normalizedValues });
        unwrapActionData(result);
        ctx.message.success(ctx.t('Record created successfully'));
        resetForm();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setRuntimeError(message);
      } finally {
        setSubmitting(false);
      }
    };

    const contentTitle = toNonEmptyString(settings.title);
    const initialValues = prepareCreateFormRecord(visibleFields, primaryKeys);

    return (
      <Spin spinning={submitting}>
        <Space
          wrap
          style={{
            display: 'flex',
            justifyContent: contentTitle ? 'space-between' : 'flex-end',
            marginBottom: token.marginSM,
          }}
        >
          {contentTitle ? (
            <Typography.Title level={5} style={{ margin: 0 }}>
              {ctx.t(contentTitle)}
            </Typography.Title>
          ) : null}
          {configurable && settings.showFieldManager !== false ? (
            <FieldManager fields={fieldConfigs} fieldMap={fieldMap} onChange={syncFieldConfigs} />
          ) : null}
        </Space>
        {runtimeError ? (
          <Alert
            closable
            type="error"
            showIcon
            message={ctx.t('Failed to create record')}
            description={runtimeError}
            style={{ marginBottom: token.marginSM }}
            onClose={() => setRuntimeError(null)}
          />
        ) : null}
        <Form form={form} layout="vertical" initialValues={initialValues} requiredMark onFinish={submitForm}>
          <div
            style={{
              display: 'grid',
              columnGap: token.marginLG,
              gridTemplateColumns: 'repeat(' + formColumns + ', minmax(0, 1fr))',
            }}
          >
            {visibleFields.map((field: FieldMeta) => (
              <FormField key={field.name} field={field} />
            ))}
          </div>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<UndoOutlined />} disabled={submitting} onClick={resetForm}>
              {ctx.t('Reset')}
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
              {ctx.t('Submit')}
            </Button>
          </Space>
        </Form>
      </Spin>
    );
  };

  ctx.render(<CreateFormView />);
}

export async function mountCreateForm() {
  try {
    await runCreateForm();
  } catch (error) {
    const { Alert } = ctx.libs.antd;
    const message = error instanceof Error ? error.message : String(error);
    ctx.render(
      <Alert type="error" showIcon message={ctx.t('Failed to initialize add form')} description={message} />,
    );
  }
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/create-form/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "create-form",
  "title": "Add form",
  "description": "A lightweight Ant Design form for creating collection records with field selection and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "Form", "Ant Design"],
  "sort": 40,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "columns": { "type": "integer", "title": "Form columns", "default": 2, "minimum": 1, "maximum": 4, "x-component": "InputNumber" },
    "maxInitialFields": { "type": "integer", "title": "Initial visible fields", "default": 8, "minimum": 1, "maximum": 30, "x-component": "InputNumber" },
    "showFieldManager": { "type": "boolean", "title": "Show field manager", "default": true, "x-component": "Switch" },
    "fields": {
      "type": "array",
      "title": "Saved fields",
      "default": [],
      "items": {
        "type": "object",
        "required": ["field", "visible"],
        "properties": {
          "field": { "type": "string" },
          "scope": { "type": "string" },
          "visible": { "type": "boolean" }
        }
      }
    }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-blocks/edit-form/index.tsx',
    content: `import { mountEditForm } from './EditForm';

const { Alert } = ctx.libs.antd;
ctx.render(<Alert type="info" showIcon message={ctx.t('Loading edit form')} />);
await mountEditForm();
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/edit-form/EditForm.tsx',
    content: `import { createFieldManager } from '../../../shared/collection-block/FieldManager';
import { FormField } from '../../../shared/collection-block/FormField';
import {
  buildCollectionRequest,
  getCollectionFields,
  getPrimaryKeys,
  getTitleField,
  getVisibleFields,
  getWritableFields,
  normalizeFieldConfigs,
  normalizeFormValues,
  prepareFormRecord,
  resolveRecordId,
  toNonEmptyString,
  toPositiveInteger,
  unwrapActionData,
} from '../../../shared/collection-block/collection-utils';
import { createCollectionBlockSettingsPersistence } from '../../../shared/collection-block/settings-persistence';
import type {
  CollectionBlockFlowModel,
  CollectionLike,
  FieldConfig,
  FieldMeta,
  JsonRecord,
  ResourceLike,
} from '../../../shared/collection-block/types';

type CollectionRuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const hasRecordId = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

async function runEditForm() {
  const React = ctx.libs.React;
  const antd = ctx.libs.antd;
  const {
    Alert,
    Button,
    Form,
    Space,
    Spin,
    Typography,
    theme,
  } = antd;
  const antdIcons = ctx.libs.antdIcons;
  const { ReloadOutlined, SaveOutlined, UndoOutlined } = antdIcons;
  const settings = ctx.settings as JsonRecord;
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName);
  const formColumns = toPositiveInteger(settings.columns, 2, 1, 4);
  const maxInitialFields = toPositiveInteger(settings.maxInitialFields, 8, 1, 30);
  const flowModel = ctx.model as unknown as CollectionBlockFlowModel;
  const runtimeContext = ctx as unknown as CollectionRuntimeContext;
  const configurable = Boolean(runtimeContext.flowSettingsEnabled);
  flowModel.setTitle(collectionName ? ctx.t('JS Edit Form') + ': ' + collectionName : ctx.t('JS Edit Form'));

  if (!collectionName) {
    ctx.render(
      <Alert
        type="info"
        showIcon
        message={ctx.t('Select a collection')}
        description={ctx.t('Open the block settings and choose the collection used by this form.')}
      />,
    );
    return;
  }

  const collection = runtimeContext.dataSourceManager?.getCollection?.(dataSourceKey, collectionName);
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

  const recordId = resolveRecordId(settings.recordId, collection, ctx.record as JsonRecord | undefined);
  if (!hasRecordId(recordId)) {
    ctx.render(
      <Alert
        type="info"
        showIcon
        message={ctx.t('Select a record')}
        description={ctx.t('Configure a record ID or render this block in a record context.')}
      />,
    );
    return;
  }

  const collectionFields = getCollectionFields(collection, (text: string) => ctx.t(text));
  const primaryKeys = getPrimaryKeys(collection);
  const fields = getWritableFields(collectionFields, primaryKeys);
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No editable fields are available')} />);
    return;
  }

  const titleField = getTitleField(collection);
  const fieldMap = new Map(fields.map((field: FieldMeta) => [field.name, field]));
  const fieldScope = dataSourceKey + ':' + collectionName + ':edit';
  const initialFieldConfigs = normalizeFieldConfigs(
    fields,
    settings.fields,
    primaryKeys,
    titleField,
    fieldScope,
    maxInitialFields,
  );
  const resource = ctx.makeResource('SingleRecordResource') as unknown as ResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);
  const scheduleSettingsPatch = createCollectionBlockSettingsPersistence({
    blockKey: 'edit-form',
    configurable,
    ctx,
    flowModel,
    settings,
  });
  const FieldManager = createFieldManager({
    React,
    antd,
    antdIcons,
    configurable,
    scheduleSettingsPatch,
    t: (text: string) => ctx.t(text),
  });

  const EditFormView = () => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const mountedRef = React.useRef(true);
    const requestRevisionRef = React.useRef(0);
    const fieldConfigsRef = React.useRef<FieldConfig[]>(initialFieldConfigs);
    const recordRef = React.useRef<JsonRecord | null>(null);
    const [fieldConfigs, setFieldConfigs] = React.useState<FieldConfig[]>(initialFieldConfigs);
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
    const visibleFields = React.useMemo(
      () => getVisibleFields(fieldConfigs, fieldMap),
      [fieldConfigs],
    );
    const loadRecord = async (nextConfigs: FieldConfig[]) => {
      if (typeof resource.runAction !== 'function') {
        setRuntimeError(ctx.t('Unable to initialize collection resource'));
        return;
      }
      const requestRevision = requestRevisionRef.current + 1;
      requestRevisionRef.current = requestRevision;
      if (mountedRef.current) {
        setLoading(true);
        setRuntimeError(null);
      }
      try {
        const request = buildCollectionRequest({
          page: 1,
          pageSize: 1,
          fieldConfigs: nextConfigs,
          fieldMap,
          primaryKeys,
          sortField: titleField || primaryKeys[0],
          sortDirection: 'asc',
        });
        const result = await resource.runAction('get', {
          method: request.method,
          params: { ...request.params, filterByTk: recordId },
        });
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        const nextRecord = unwrapActionData(result) as JsonRecord | null | undefined;
        if (!nextRecord || typeof nextRecord !== 'object' || Array.isArray(nextRecord)) {
          recordRef.current = null;
          form.resetFields();
          setRuntimeError(ctx.t('Record not found'));
          return;
        }
        recordRef.current = nextRecord;
        const nextFields = getVisibleFields(nextConfigs, fieldMap);
        form.setFieldsValue(prepareFormRecord(nextRecord, nextFields, primaryKeys));
      } catch (error) {
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        setRuntimeError(error instanceof Error ? error.message : String(error));
      } finally {
        if (mountedRef.current && requestRevisionRef.current === requestRevision) setLoading(false);
      }
    };

    React.useEffect(() => {
      mountedRef.current = true;
      loadRecord(fieldConfigsRef.current);
      return () => {
        mountedRef.current = false;
        requestRevisionRef.current += 1;
      };
    }, []);

    const syncFieldConfigs = (nextConfigs: FieldConfig[]) => {
      fieldConfigsRef.current = nextConfigs;
      setFieldConfigs(nextConfigs);
      loadRecord(nextConfigs);
    };

    const refreshRecord = async () => {
      await loadRecord(fieldConfigsRef.current);
    };

    const resetForm = () => {
      const currentRecord = recordRef.current;
      if (!currentRecord) return;
      const currentFields = getVisibleFields(fieldConfigsRef.current, fieldMap);
      form.resetFields();
      form.setFieldsValue(prepareFormRecord(currentRecord, currentFields, primaryKeys));
      setRuntimeError(null);
    };

    const submitForm = async (values: JsonRecord) => {
      if (typeof resource.runAction !== 'function') {
        setRuntimeError(ctx.t('Unable to initialize collection resource'));
        return;
      }
      setSubmitting(true);
      setRuntimeError(null);
      try {
        const currentFields = getVisibleFields(fieldConfigsRef.current, fieldMap);
        const normalizedValues = normalizeFormValues(values, currentFields, primaryKeys);
        const result = await resource.runAction('update', {
          params: { filterByTk: recordId },
          data: normalizedValues,
        });
        unwrapActionData(result);
        ctx.message.success(ctx.t('Record updated successfully'));
        await loadRecord(fieldConfigsRef.current);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setRuntimeError(message);
      } finally {
        setSubmitting(false);
      }
    };

    const contentTitle = toNonEmptyString(settings.title);

    return (
      <Spin spinning={loading || submitting}>
        <Space
          wrap
          style={{
            display: 'flex',
            justifyContent: contentTitle ? 'space-between' : 'flex-end',
            marginBottom: token.marginSM,
          }}
        >
          {contentTitle ? (
            <Typography.Title level={5} style={{ margin: 0 }}>
              {ctx.t(contentTitle)}
            </Typography.Title>
          ) : null}
          <Space wrap>
            {configurable && settings.showFieldManager !== false ? (
              <FieldManager fields={fieldConfigs} fieldMap={fieldMap} onChange={syncFieldConfigs} />
            ) : null}
            <Button icon={<ReloadOutlined />} loading={loading} disabled={submitting} onClick={refreshRecord}>
              {ctx.t('Refresh')}
            </Button>
          </Space>
        </Space>
        {runtimeError ? (
          <Alert
            closable
            type="error"
            showIcon
            message={ctx.t('Failed to load or update record')}
            description={runtimeError}
            style={{ marginBottom: token.marginSM }}
            onClose={() => setRuntimeError(null)}
          />
        ) : null}
        <Form form={form} layout="vertical" requiredMark onFinish={submitForm}>
          <div
            style={{
              display: 'grid',
              columnGap: token.marginLG,
              gridTemplateColumns: 'repeat(' + formColumns + ', minmax(0, 1fr))',
            }}
          >
            {visibleFields.map((field: FieldMeta) => (
              <FormField key={field.name} field={field} />
            ))}
          </div>
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<UndoOutlined />} disabled={loading || submitting} onClick={resetForm}>
              {ctx.t('Reset')}
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} disabled={loading}>
              {ctx.t('Submit')}
            </Button>
          </Space>
        </Form>
      </Spin>
    );
  };

  ctx.render(<EditFormView />);
}

export async function mountEditForm() {
  try {
    await runEditForm();
  } catch (error) {
    const { Alert } = ctx.libs.antd;
    const message = error instanceof Error ? error.message : String(error);
    ctx.render(
      <Alert type="error" showIcon message={ctx.t('Failed to initialize edit form')} description={message} />,
    );
  }
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/edit-form/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "edit-form",
  "title": "Edit form",
  "description": "A lightweight Ant Design form for editing one collection record with field selection and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "Form", "Ant Design"],
  "sort": 50,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "recordId": { "type": "string", "title": "Record ID", "description": "Optional when the block is rendered in a record context.", "x-component": "Input" },
    "columns": { "type": "integer", "title": "Form columns", "default": 2, "minimum": 1, "maximum": 4, "x-component": "InputNumber" },
    "maxInitialFields": { "type": "integer", "title": "Initial visible fields", "default": 8, "minimum": 1, "maximum": 30, "x-component": "InputNumber" },
    "showFieldManager": { "type": "boolean", "title": "Show field manager", "default": true, "x-component": "Switch" },
    "fields": {
      "type": "array",
      "title": "Saved fields",
      "default": [],
      "items": {
        "type": "object",
        "required": ["field", "visible"],
        "properties": {
          "field": { "type": "string" },
          "scope": { "type": "string" },
          "visible": { "type": "boolean" }
        }
      }
    }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-blocks/details/index.tsx',
    content: `import { mountDetailsBlock } from './DetailsBlock';

const { Alert } = ctx.libs.antd;
ctx.render(<Alert type="info" showIcon message={ctx.t('Loading details')} />);
await mountDetailsBlock();
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/details/DetailsBlock.tsx',
    content: `import { DisplayValue } from '../../../shared/collection-block/DisplayValue';
import { createFieldManager } from '../../../shared/collection-block/FieldManager';
import {
  buildCollectionRequest,
  getCollectionFields,
  getPrimaryKeys,
  getTitleField,
  getVisibleFields,
  normalizeFieldConfigs,
  resolveRecordId,
  toNonEmptyString,
  toPositiveInteger,
  unwrapActionData,
} from '../../../shared/collection-block/collection-utils';
import { createCollectionBlockSettingsPersistence } from '../../../shared/collection-block/settings-persistence';
import type {
  CollectionBlockFlowModel,
  CollectionLike,
  FieldConfig,
  FieldMeta,
  JsonRecord,
  ResourceLike,
} from '../../../shared/collection-block/types';

type CollectionRuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const hasRecordId = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

async function runDetailsBlock() {
  const React = ctx.libs.React;
  const antd = ctx.libs.antd;
  const {
    Alert,
    Button,
    Descriptions,
    Empty,
    Space,
    Spin,
    Typography,
    theme,
  } = antd;
  const antdIcons = ctx.libs.antdIcons;
  const { ReloadOutlined } = antdIcons;
  const settings = ctx.settings as JsonRecord;
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName);
  const descriptionColumns = toPositiveInteger(settings.columns, 2, 1, 4);
  const maxInitialFields = toPositiveInteger(settings.maxInitialFields, 10, 1, 40);
  const flowModel = ctx.model as unknown as CollectionBlockFlowModel;
  const runtimeContext = ctx as unknown as CollectionRuntimeContext;
  const configurable = Boolean(runtimeContext.flowSettingsEnabled);
  flowModel.setTitle(collectionName ? ctx.t('JS Details') + ': ' + collectionName : ctx.t('JS Details'));

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

  const collection = runtimeContext.dataSourceManager?.getCollection?.(dataSourceKey, collectionName);
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

  const recordId = resolveRecordId(settings.recordId, collection, ctx.record as JsonRecord | undefined);
  if (!hasRecordId(recordId)) {
    ctx.render(
      <Alert
        type="info"
        showIcon
        message={ctx.t('Select a record')}
        description={ctx.t('Configure a record ID or render this block in a record context.')}
      />,
    );
    return;
  }

  const fields = getCollectionFields(collection, (text: string) => ctx.t(text));
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No fields are available for this collection')} />);
    return;
  }

  const primaryKeys = getPrimaryKeys(collection);
  const titleField = getTitleField(collection);
  const fieldMap = new Map(fields.map((field: FieldMeta) => [field.name, field]));
  const fieldScope = dataSourceKey + ':' + collectionName + ':details';
  const initialFieldConfigs = normalizeFieldConfigs(
    fields,
    settings.fields,
    primaryKeys,
    titleField,
    fieldScope,
    maxInitialFields,
  );
  const resource = ctx.makeResource('SingleRecordResource') as unknown as ResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);
  const scheduleSettingsPatch = createCollectionBlockSettingsPersistence({
    blockKey: 'details',
    configurable,
    ctx,
    flowModel,
    settings,
  });
  const FieldManager = createFieldManager({
    React,
    antd,
    antdIcons,
    configurable,
    scheduleSettingsPatch,
    t: (text: string) => ctx.t(text),
  });

  const DetailsView = () => {
    const { token } = theme.useToken();
    const mountedRef = React.useRef(true);
    const requestRevisionRef = React.useRef(0);
    const fieldConfigsRef = React.useRef<FieldConfig[]>(initialFieldConfigs);
    const [fieldConfigs, setFieldConfigs] = React.useState<FieldConfig[]>(initialFieldConfigs);
    const [record, setRecord] = React.useState<JsonRecord | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [runtimeError, setRuntimeError] = React.useState<string | null>(null);
    const visibleFields = React.useMemo(
      () => getVisibleFields(fieldConfigs, fieldMap),
      [fieldConfigs],
    );
    const loadRecord = async (nextConfigs: FieldConfig[]) => {
      if (typeof resource.runAction !== 'function') {
        setRuntimeError(ctx.t('Unable to initialize collection resource'));
        return;
      }
      const requestRevision = requestRevisionRef.current + 1;
      requestRevisionRef.current = requestRevision;
      if (mountedRef.current) {
        setLoading(true);
        setRuntimeError(null);
      }
      try {
        const request = buildCollectionRequest({
          page: 1,
          pageSize: 1,
          fieldConfigs: nextConfigs,
          fieldMap,
          primaryKeys,
          sortField: titleField || primaryKeys[0],
          sortDirection: 'asc',
        });
        const result = await resource.runAction('get', {
          method: request.method,
          params: { ...request.params, filterByTk: recordId },
        });
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        const nextRecord = unwrapActionData(result) as JsonRecord | null | undefined;
        if (!nextRecord || typeof nextRecord !== 'object' || Array.isArray(nextRecord)) {
          setRecord(null);
          setRuntimeError(ctx.t('Record not found'));
          return;
        }
        setRecord(nextRecord);
      } catch (error) {
        if (!mountedRef.current || requestRevisionRef.current !== requestRevision) return;
        setRuntimeError(error instanceof Error ? error.message : String(error));
      } finally {
        if (mountedRef.current && requestRevisionRef.current === requestRevision) setLoading(false);
      }
    };

    React.useEffect(() => {
      mountedRef.current = true;
      loadRecord(fieldConfigsRef.current);
      return () => {
        mountedRef.current = false;
        requestRevisionRef.current += 1;
      };
    }, []);

    const syncFieldConfigs = (nextConfigs: FieldConfig[]) => {
      fieldConfigsRef.current = nextConfigs;
      setFieldConfigs(nextConfigs);
      loadRecord(nextConfigs);
    };

    const refreshRecord = async () => {
      await loadRecord(fieldConfigsRef.current);
    };

    const contentTitle = toNonEmptyString(settings.title);

    return (
      <Spin spinning={loading}>
        <Space
          wrap
          style={{
            display: 'flex',
            justifyContent: contentTitle ? 'space-between' : 'flex-end',
            marginBottom: token.marginSM,
          }}
        >
          {contentTitle ? (
            <Typography.Title level={5} style={{ margin: 0 }}>
              {ctx.t(contentTitle)}
            </Typography.Title>
          ) : null}
          <Space wrap>
            {configurable && settings.showFieldManager !== false ? (
              <FieldManager fields={fieldConfigs} fieldMap={fieldMap} onChange={syncFieldConfigs} />
            ) : null}
            <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshRecord}>
              {ctx.t('Refresh')}
            </Button>
          </Space>
        </Space>
        {runtimeError ? (
          <Alert
            closable
            type="error"
            showIcon
            message={ctx.t('Failed to load record')}
            description={runtimeError}
            style={{ marginBottom: token.marginSM }}
            onClose={() => setRuntimeError(null)}
          />
        ) : null}
        {!loading && !record ? (
          <Empty description={ctx.t(String(settings.emptyText || 'No data'))} />
        ) : record ? (
          <Descriptions bordered size="small" column={descriptionColumns}>
            {visibleFields.map((field: FieldMeta) => (
              <Descriptions.Item key={field.name} label={field.title || field.name}>
                <DisplayValue field={field} value={record[field.name]} />
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : null}
      </Spin>
    );
  };

  ctx.render(<DetailsView />);
}

export async function mountDetailsBlock() {
  try {
    await runDetailsBlock();
  } catch (error) {
    const { Alert } = ctx.libs.antd;
    const message = error instanceof Error ? error.message : String(error);
    ctx.render(
      <Alert type="error" showIcon message={ctx.t('Failed to initialize details')} description={message} />,
    );
  }
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/details/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "details",
  "title": "Details",
  "description": "A lightweight Ant Design details block for one collection record with field selection and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "Details", "Ant Design"],
  "sort": 60,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "recordId": { "type": "string", "title": "Record ID", "description": "Optional when the block is rendered in a record context.", "x-component": "Input" },
    "columns": { "type": "integer", "title": "Details columns", "default": 2, "minimum": 1, "maximum": 4, "x-component": "InputNumber" },
    "maxInitialFields": { "type": "integer", "title": "Initial visible fields", "default": 10, "minimum": 1, "maximum": 40, "x-component": "InputNumber" },
    "showFieldManager": { "type": "boolean", "title": "Show field manager", "default": true, "x-component": "Switch" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "No data", "x-component": "Input" },
    "fields": {
      "type": "array",
      "title": "Saved fields",
      "default": [],
      "items": {
        "type": "object",
        "required": ["field", "visible"],
        "properties": {
          "field": { "type": "string" },
          "scope": { "type": "string" },
          "visible": { "type": "boolean" }
        }
      }
    }
  }
}
`,
    language: 'json',
  },
];
