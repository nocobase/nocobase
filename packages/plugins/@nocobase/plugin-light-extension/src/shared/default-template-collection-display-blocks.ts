/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_COLLECTION_DISPLAY_BLOCK_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'src/client/js-blocks/collection-list/index.tsx',
    content: `import { mountCollectionList } from './CollectionList';

const { Alert } = ctx.libs.antd;
ctx.render(<Alert type="info" showIcon message={ctx.t('Loading list')} />);
await mountCollectionList();
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-list/ListRecord.tsx',
    content: `import { DisplayValue } from '../../../shared/collection-block/DisplayValue';
import type { FieldMeta, JsonRecord } from '../../../shared/collection-block/types';

export const ListRecord = ({ fields, record }: { fields: FieldMeta[]; record: JsonRecord }) => {
  const { Descriptions } = ctx.libs.antd;
  const items = fields.map((field) => ({
    key: field.name,
    label: field.title || field.name,
    children: <DisplayValue field={field} value={record[field.name]} />,
  }));

  return <Descriptions size="small" column={1} items={items} />;
};
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-list/CollectionList.tsx',
    content: `import { createFieldManager } from '../../../shared/collection-block/FieldManager';
import {
  buildCollectionRequest,
  getCollectionFields,
  getPrimaryKeys,
  getTitleField,
  getVisibleFields,
  normalizeFieldConfigs,
  toNonEmptyString,
  toPositiveInteger,
} from '../../../shared/collection-block/collection-utils';
import { createCollectionBlockSettingsPersistence } from '../../../shared/collection-block/settings-persistence';
import type {
  CollectionLike,
  CollectionBlockFlowModel,
  FieldConfig,
  FieldMeta,
  JsonRecord,
  MultiRecordResourceLike,
} from '../../../shared/collection-block/types';
import { useCollectionRecords } from '../../../shared/collection-block/useCollectionRecords';
import { ListRecord } from './ListRecord';

type RuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const getRecordKey = (record: JsonRecord, primaryKeys: string[]): string => {
  const values = primaryKeys.flatMap((key) => {
    const value = record[key];
    return value === undefined || value === null || value === '' ? [] : [String(value)];
  });
  if (values.length) return values.join('|');
  try {
    return JSON.stringify(record);
  } catch {
    return Object.keys(record)
      .sort()
      .map((key) => key + ':' + String(record[key]))
      .join('|');
  }
};

async function runCollectionList() {
  const React = ctx.libs.React;
  const { Alert, Button, List, Space, theme, Typography } = ctx.libs.antd;
  const { ReloadOutlined } = ctx.libs.antdIcons;
  const settings = ctx.settings;
  const contentTitle = toNonEmptyString(settings.title);
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName);
  const pageSize = toPositiveInteger(settings.pageSize, 20, 5, 200);
  const maxInitialFields = toPositiveInteger(settings.maxInitialFields, 6, 1, 20);
  const showFieldManager = settings.showFieldManager !== false;
  const emptyText = toNonEmptyString(settings.emptyText) || 'No data';
  const scope = dataSourceKey + ':' + (collectionName || '');
  const runtimeContext = ctx as unknown as RuntimeContext;
  const configurable = Boolean(runtimeContext.flowSettingsEnabled);
  const flowModel = ctx.model as unknown as CollectionBlockFlowModel;
  flowModel.setTitle(collectionName ? ctx.t('JS List') + ': ' + collectionName : ctx.t('JS List'));

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

  const fields = getCollectionFields(collection, (text) => ctx.t(text));
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No fields are available for this collection')} />);
    return;
  }

  const primaryKeys = getPrimaryKeys(collection);
  const titleField = getTitleField(collection);
  const fieldMap = new Map<string, FieldMeta>(fields.map((field) => [field.name, field]));
  const initialFields = normalizeFieldConfigs(
    fields,
    settings.fields,
    primaryKeys,
    titleField,
    scope,
    maxInitialFields,
  );
  const initialSortField = toNonEmptyString(settings.sortField);
  const sortField = initialSortField && fieldMap.has(initialSortField) ? initialSortField : undefined;
  const sortDirection = settings.sortDirection === 'desc' ? 'desc' : 'asc';
  const resource = ctx.makeResource('MultiRecordResource') as unknown as MultiRecordResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);

  const scheduleSettingsPatch = createCollectionBlockSettingsPersistence({
    blockKey: 'collection-list',
    configurable,
    ctx,
    flowModel,
    settings,
  });
  const FieldManager = createFieldManager({
    React,
    antd: ctx.libs.antd,
    antdIcons: ctx.libs.antdIcons,
    configurable,
    scheduleSettingsPatch,
    t: (text) => ctx.t(text),
  });

  const CollectionList = () => {
    const { token } = theme.useToken();
    const fieldsRef = React.useRef<FieldConfig[]>(initialFields);
    const [fieldConfigs, setFieldConfigs] = React.useState<FieldConfig[]>(initialFields);
    const buildRequest = (nextPage: number, nextPageSize: number) =>
      buildCollectionRequest({
        page: nextPage,
        pageSize: nextPageSize,
        fieldConfigs: fieldsRef.current,
        fieldMap,
        primaryKeys,
        sortField,
        sortDirection,
      });
    const { loadRecords, loading, pagination, paginationRef, rows, runtimeError } = useCollectionRecords({
      React,
      resource,
      pageSize,
      buildRequest,
      t: (text) => ctx.t(text),
    });

    const visibleFields = getVisibleFields(fieldConfigs, fieldMap);
    const updateFields = (nextFields: FieldConfig[]) => {
      fieldsRef.current = nextFields;
      setFieldConfigs(nextFields);
      loadRecords(1, paginationRef.current.pageSize);
    };
    const refreshList = () => {
      loadRecords(paginationRef.current.current, paginationRef.current.pageSize);
    };
    const changePage = (nextPage: number, nextPageSize: number) => {
      const pageSizeChanged = nextPageSize !== paginationRef.current.pageSize;
      if (pageSizeChanged) scheduleSettingsPatch({ pageSize: nextPageSize });
      loadRecords(pageSizeChanged ? 1 : nextPage, nextPageSize);
    };

    return (
      <div>
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
          <Space>
            {showFieldManager ? (
              <FieldManager fields={fieldConfigs} fieldMap={fieldMap} onChange={updateFields} />
            ) : null}
            <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshList}>
              {ctx.t('Refresh')}
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
        <List
          dataSource={rows}
          loading={loading}
          locale={{ emptyText: ctx.t(emptyText) }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: [10, 20, 50, 100],
            showSizeChanger: true,
            onChange: changePage,
            ...(pagination.totalKnown
              ? { showTotal: (total: number) => ctx.t('Total') + ' ' + total + ' ' + ctx.t('items') }
              : {}),
          }}
          rowKey={(record: JsonRecord) => getRecordKey(record, primaryKeys)}
          renderItem={(record: JsonRecord) => (
            <List.Item>
              <ListRecord fields={visibleFields} record={record} />
            </List.Item>
          )}
        />
      </div>
    );
  };

  ctx.render(<CollectionList />);
}

export async function mountCollectionList() {
  try {
    await runCollectionList();
  } catch (error) {
    const { Alert } = ctx.libs.antd;
    const message = error instanceof Error ? error.message : String(error);
    ctx.render(<Alert type="error" showIcon message={ctx.t('Failed to initialize list')} description={message} />);
  }
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-list/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "collection-list",
  "title": "List",
  "description": "A lightweight Ant Design list with collection binding, field management, pagination, sorting, refresh, and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "List", "Ant Design"],
  "sort": 40,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "pageSize": { "type": "integer", "title": "Page size", "default": 20, "minimum": 5, "maximum": 200, "x-component": "InputNumber" },
    "maxInitialFields": { "type": "integer", "title": "Initial visible fields", "default": 6, "minimum": 1, "maximum": 20, "x-component": "InputNumber" },
    "showFieldManager": { "type": "boolean", "title": "Show field manager", "default": true, "x-component": "Switch" },
    "sortField": { "type": "string", "title": "Sort field", "x-component": "CollectionFieldSelect", "x-component-props": { "dataSourceField": "dataSourceKey", "collectionField": "collectionName" } },
    "sortDirection": { "type": "string", "title": "Sort direction", "default": "asc", "enum": ["asc", "desc"], "x-component": "Radio.Group" },
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
  {
    path: 'src/client/js-blocks/collection-grid-card/index.tsx',
    content: `import { mountCollectionGridCard } from './CollectionGridCard';

const { Alert } = ctx.libs.antd;
ctx.render(<Alert type="info" showIcon message={ctx.t('Loading grid card')} />);
await mountCollectionGridCard();
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-grid-card/GridCardRecord.tsx',
    content: `import { DisplayValue } from '../../../shared/collection-block/DisplayValue';
import type { FieldMeta, JsonRecord } from '../../../shared/collection-block/types';

export const GridCardRecord = ({
  fields,
  record,
  titleField,
}: {
  fields: FieldMeta[];
  record: JsonRecord;
  titleField?: string;
}) => {
  const { Card, Descriptions } = ctx.libs.antd;
  const titleItem = titleField ? fields.find((field) => field.name === titleField) : undefined;
  const detailFields = titleItem ? fields.filter((field) => field.name !== titleField) : fields;
  const title = titleItem ? <DisplayValue field={titleItem} value={record[titleItem.name]} /> : undefined;
  const items = detailFields.map((field) => ({
    key: field.name,
    label: field.title || field.name,
    children: <DisplayValue field={field} value={record[field.name]} />,
  }));

  return (
    <Card size="small" title={title} style={{ height: '100%', width: '100%' }}>
      {items.length ? <Descriptions size="small" column={1} items={items} /> : null}
    </Card>
  );
};
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-grid-card/CollectionGridCard.tsx',
    content: `import { createFieldManager } from '../../../shared/collection-block/FieldManager';
import {
  buildCollectionRequest,
  getCollectionFields,
  getPrimaryKeys,
  getTitleField,
  getVisibleFields,
  normalizeFieldConfigs,
  toNonEmptyString,
  toPositiveInteger,
} from '../../../shared/collection-block/collection-utils';
import { createCollectionBlockSettingsPersistence } from '../../../shared/collection-block/settings-persistence';
import type {
  CollectionBlockFlowModel,
  CollectionLike,
  FieldConfig,
  FieldMeta,
  JsonRecord,
  MultiRecordResourceLike,
} from '../../../shared/collection-block/types';
import { useCollectionRecords } from '../../../shared/collection-block/useCollectionRecords';
import { GridCardRecord } from './GridCardRecord';

type RuntimeContext = {
  flowSettingsEnabled?: unknown;
  dataSourceManager?: {
    getCollection?: (dataSourceKey: string, collectionName: string) => CollectionLike | undefined;
  };
};

const getRecordKey = (record: JsonRecord, primaryKeys: string[]): string => {
  const values = primaryKeys.flatMap((key) => {
    const value = record[key];
    return value === undefined || value === null || value === '' ? [] : [String(value)];
  });
  if (values.length) return values.join('|');
  try {
    return JSON.stringify(record);
  } catch {
    return Object.keys(record)
      .sort()
      .map((key) => key + ':' + String(record[key]))
      .join('|');
  }
};

async function runCollectionGridCard() {
  const React = ctx.libs.React;
  const { Alert, Button, List, Space, theme, Typography } = ctx.libs.antd;
  const { ReloadOutlined } = ctx.libs.antdIcons;
  const settings = ctx.settings;
  const contentTitle = toNonEmptyString(settings.title);
  const dataSourceKey = toNonEmptyString(settings.dataSourceKey) || 'main';
  const collectionName = toNonEmptyString(settings.collectionName);
  const pageSize = toPositiveInteger(settings.pageSize, 12, 4, 200);
  const columns = toPositiveInteger(settings.columns, 3, 1, 6);
  const maxInitialFields = toPositiveInteger(settings.maxInitialFields, 5, 1, 20);
  const showFieldManager = settings.showFieldManager !== false;
  const emptyText = toNonEmptyString(settings.emptyText) || 'No data';
  const scope = dataSourceKey + ':' + (collectionName || '');
  const runtimeContext = ctx as unknown as RuntimeContext;
  const configurable = Boolean(runtimeContext.flowSettingsEnabled);
  const flowModel = ctx.model as unknown as CollectionBlockFlowModel;
  flowModel.setTitle(
    collectionName ? ctx.t('JS Grid Card') + ': ' + collectionName : ctx.t('JS Grid Card'),
  );

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

  const fields = getCollectionFields(collection, (text) => ctx.t(text));
  if (!fields.length) {
    ctx.render(<Alert type="warning" showIcon message={ctx.t('No fields are available for this collection')} />);
    return;
  }

  const primaryKeys = getPrimaryKeys(collection);
  const titleField = getTitleField(collection);
  const fieldMap = new Map<string, FieldMeta>(fields.map((field) => [field.name, field]));
  const initialFields = normalizeFieldConfigs(
    fields,
    settings.fields,
    primaryKeys,
    titleField,
    scope,
    maxInitialFields,
  );
  const initialSortField = toNonEmptyString(settings.sortField);
  const sortField = initialSortField && fieldMap.has(initialSortField) ? initialSortField : undefined;
  const sortDirection = settings.sortDirection === 'desc' ? 'desc' : 'asc';
  const resource = ctx.makeResource('MultiRecordResource') as unknown as MultiRecordResourceLike;
  resource.setDataSourceKey?.(dataSourceKey);
  resource.setResourceName?.(collectionName);

  const scheduleSettingsPatch = createCollectionBlockSettingsPersistence({
    blockKey: 'collection-grid-card',
    configurable,
    ctx,
    flowModel,
    settings,
  });
  const FieldManager = createFieldManager({
    React,
    antd: ctx.libs.antd,
    antdIcons: ctx.libs.antdIcons,
    configurable,
    scheduleSettingsPatch,
    t: (text) => ctx.t(text),
  });

  const CollectionGridCard = () => {
    const { token } = theme.useToken();
    const fieldsRef = React.useRef<FieldConfig[]>(initialFields);
    const [fieldConfigs, setFieldConfigs] = React.useState<FieldConfig[]>(initialFields);
    const buildRequest = (nextPage: number, nextPageSize: number) =>
      buildCollectionRequest({
        page: nextPage,
        pageSize: nextPageSize,
        fieldConfigs: fieldsRef.current,
        fieldMap,
        primaryKeys,
        sortField,
        sortDirection,
      });
    const { loadRecords, loading, pagination, paginationRef, rows, runtimeError } = useCollectionRecords({
      React,
      resource,
      pageSize,
      buildRequest,
      t: (text) => ctx.t(text),
    });

    const visibleFields = getVisibleFields(fieldConfigs, fieldMap);
    const updateFields = (nextFields: FieldConfig[]) => {
      fieldsRef.current = nextFields;
      setFieldConfigs(nextFields);
      loadRecords(1, paginationRef.current.pageSize);
    };
    const refreshGridCard = () => {
      loadRecords(paginationRef.current.current, paginationRef.current.pageSize);
    };
    const changePage = (nextPage: number, nextPageSize: number) => {
      const pageSizeChanged = nextPageSize !== paginationRef.current.pageSize;
      if (pageSizeChanged) scheduleSettingsPatch({ pageSize: nextPageSize });
      loadRecords(pageSizeChanged ? 1 : nextPage, nextPageSize);
    };
    const responsiveColumns = {
      xs: 1,
      sm: Math.min(2, columns),
      md: Math.min(2, columns),
      lg: columns,
      xl: columns,
      xxl: columns,
    };

    return (
      <div>
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
          <Space>
            {showFieldManager ? (
              <FieldManager fields={fieldConfigs} fieldMap={fieldMap} onChange={updateFields} />
            ) : null}
            <Button icon={<ReloadOutlined />} loading={loading} onClick={refreshGridCard}>
              {ctx.t('Refresh')}
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
        <List
          dataSource={rows}
          grid={{ ...responsiveColumns, gutter: token.marginSM }}
          loading={loading}
          locale={{ emptyText: ctx.t(emptyText) }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: [6, 12, 24, 48],
            showSizeChanger: true,
            onChange: changePage,
            ...(pagination.totalKnown
              ? { showTotal: (total: number) => ctx.t('Total') + ' ' + total + ' ' + ctx.t('items') }
              : {}),
          }}
          rowKey={(record: JsonRecord) => getRecordKey(record, primaryKeys)}
          renderItem={(record: JsonRecord) => (
            <List.Item style={{ height: '100%' }}>
              <GridCardRecord fields={visibleFields} record={record} titleField={titleField} />
            </List.Item>
          )}
        />
      </div>
    );
  };

  ctx.render(<CollectionGridCard />);
}

export async function mountCollectionGridCard() {
  try {
    await runCollectionGridCard();
  } catch (error) {
    const { Alert } = ctx.libs.antd;
    const message = error instanceof Error ? error.message : String(error);
    ctx.render(
      <Alert type="error" showIcon message={ctx.t('Failed to initialize grid card')} description={message} />,
    );
  }
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-grid-card/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "collection-grid-card",
  "title": "Grid card",
  "description": "A lightweight Ant Design grid card with collection binding, field management, responsive columns, pagination, sorting, refresh, and FlowModel persistence.",
  "category": "examples",
  "tags": ["JS Block", "Collection", "Grid card", "Ant Design"],
  "sort": 50,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "", "x-component": "Input" },
    "dataSourceKey": { "type": "string", "title": "Data source", "default": "main", "required": true, "x-component": "DataSourceSelect" },
    "collectionName": { "type": "string", "title": "Collection", "x-component": "CollectionSelect", "x-component-props": { "dataSourceField": "dataSourceKey" } },
    "pageSize": { "type": "integer", "title": "Page size", "default": 12, "minimum": 4, "maximum": 200, "x-component": "InputNumber" },
    "columns": { "type": "integer", "title": "Columns", "default": 3, "minimum": 1, "maximum": 6, "x-component": "InputNumber" },
    "maxInitialFields": { "type": "integer", "title": "Initial visible fields", "default": 5, "minimum": 1, "maximum": 20, "x-component": "InputNumber" },
    "showFieldManager": { "type": "boolean", "title": "Show field manager", "default": true, "x-component": "Switch" },
    "sortField": { "type": "string", "title": "Sort field", "x-component": "CollectionFieldSelect", "x-component-props": { "dataSourceField": "dataSourceKey", "collectionField": "collectionName" } },
    "sortDirection": { "type": "string", "title": "Sort direction", "default": "asc", "enum": ["asc", "desc"], "x-component": "Radio.Group" },
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
