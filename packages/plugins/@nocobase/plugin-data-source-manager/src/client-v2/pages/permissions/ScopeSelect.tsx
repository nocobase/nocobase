/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DrawerFormLayout,
  FilterGroup,
  Table,
  VariableFilterItem,
  type CompiledFilter,
  type VariableFilterItemValue,
} from '@nocobase/client-v2';
import type { Collection, Converters, FlowEngineContext, MetaTreeNode } from '@nocobase/flow-engine';
import { FlowModel, FlowModelProvider, observable, randomId, useFlowContext } from '@nocobase/flow-engine';
import { PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Form, Input, Select, Space, theme, Tooltip } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { compileLegacyTemplate, compileLegacyTemplateText } from '../../utils/compileLegacyTemplate';
import {
  destroyScopeRecord,
  saveScopeRecord,
  type CreateUpdateResource,
  type DestroyResource,
  type ListResource,
} from './permissionRequests';
import type { ScopeRecord } from './types';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const DATA_SCOPE_PAGE_SIZE = 20;
const DATA_SCOPE_DRAWER_WIDTH = '50%';

type PermissionFilterGroupItem = VariableFilterItemValue | PermissionFilterGroupValue;

interface PermissionFilterGroupValue {
  logic: '$and' | '$or';
  items: PermissionFilterGroupItem[];
}

interface PermissionScopeFilterRef {
  getFilter: () => CompiledFilter;
}

function isFilterGroup(item: PermissionFilterGroupItem): item is PermissionFilterGroupValue {
  return Array.isArray((item as PermissionFilterGroupValue).items);
}

function nestFilterPath(path: string, leaf: unknown) {
  const segments = path.split('.');
  let result: unknown = leaf;
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    result = { [segments[index]]: result };
  }
  return result as Record<string, unknown>;
}

function isEmptyFilterValue(value: VariableFilterItemValue['value']) {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === 'object' && Object.keys(value).length === 0;
}

function compilePermissionFilter(group: PermissionFilterGroupValue | undefined): CompiledFilter {
  if (!group?.items.length) {
    return undefined;
  }
  const items = group.items
    .map((item) => {
      if (isFilterGroup(item)) {
        return compilePermissionFilter(item);
      }
      if (!item.path || !item.operator || isEmptyFilterValue(item.value)) {
        return undefined;
      }
      return nestFilterPath(item.path, { [item.operator]: item.value });
    })
    .filter((item): item is Record<string, unknown> => Boolean(item));
  return items.length ? { [group.logic]: items } : undefined;
}

function decompilePermissionConditions(value: unknown, path: string[] = []): PermissionFilterGroupItem[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return path.length
      ? [{ path: path.join('.'), operator: '$eq', value: value as VariableFilterItemValue['value'] }]
      : [];
  }
  const entries = Object.entries(value as Record<string, unknown>);
  const operatorEntries = entries.filter(([key]) => key.startsWith('$'));
  if (operatorEntries.length) {
    return operatorEntries.map(([operator, operatorValue]) => ({
      path: path.join('.'),
      operator,
      value: operatorValue as VariableFilterItemValue['value'],
    }));
  }
  return entries.flatMap(([fieldName, nextValue]) => decompilePermissionConditions(nextValue, [...path, fieldName]));
}

function decompilePermissionFilter(filter: CompiledFilter): PermissionFilterGroupValue {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    return { logic: '$and', items: [] };
  }
  const record = filter as Record<string, unknown>;
  const logic = Array.isArray(record.$or) ? '$or' : '$and';
  const sourceItems = Array.isArray(record[logic]) ? (record[logic] as unknown[]) : [record];
  return {
    logic,
    items: sourceItems.flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return [];
      }
      const nested = item as Record<string, unknown>;
      if (Array.isArray(nested.$and) || Array.isArray(nested.$or)) {
        return [decompilePermissionFilter(nested)];
      }
      return decompilePermissionConditions(nested);
    }),
  };
}

const permissionVariableConverters: Pick<Converters, 'resolvePathFromValue' | 'resolveValueFromPath'> = {
  resolvePathFromValue(value) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const expression = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/)?.[1];
    if (!expression) {
      return undefined;
    }
    if (expression === '$nRole' || expression === 'ctx.state.currentRole') {
      return ['role'];
    }
    const userMatch = expression.match(/^(?:\$user|ctx\.state\.currentUser)(?:\.(.+))?$/);
    return userMatch ? ['user', ...(userMatch[1] ? userMatch[1].split('.') : [])] : undefined;
  },
  resolveValueFromPath(metaTreeNode) {
    const [root, ...path] = metaTreeNode.paths;
    if (root === 'role') {
      return '{{$nRole}}';
    }
    if (root === 'user' && path.length) {
      return `{{$user.${path.join('.')}}}`;
    }
    return undefined;
  },
};

interface PermissionScopeFilterProps {
  collection: Collection | undefined;
  initialValue?: CompiledFilter;
}

const PermissionScopeFilter = forwardRef<PermissionScopeFilterRef, PermissionScopeFilterProps>((props, ref) => {
  const ctx = useFlowContext<FlowEngineContext>();
  const [model, setModel] = useState<FlowModel>();
  const filterValueRef = useRef<PermissionFilterGroupValue>();
  if (!filterValueRef.current) {
    filterValueRef.current = observable(decompilePermissionFilter(props.initialValue)) as PermissionFilterGroupValue;
  }

  useEffect(() => {
    if (!props.collection) {
      setModel(undefined);
      return;
    }
    const nextModel = ctx.engine.createModel<FlowModel>({
      uid: randomId('permissionScopeFilter_'),
      use: FlowModel,
    });
    nextModel.context.defineProperty('collection', { value: props.collection });
    setModel(nextModel);

    return () => {
      nextModel.remove();
    };
  }, [ctx.engine, props.collection]);

  useImperativeHandle(
    ref,
    () => ({
      getFilter: () => compilePermissionFilter(filterValueRef.current),
    }),
    [],
  );

  const rightMetaTree = useMemo(
    () => async () => {
      if (!model) {
        return [];
      }
      const tree = await model.context.getPropertyMetaTree();
      return tree
        .filter((node: MetaTreeNode) => node.name === 'user' || node.name === 'role')
        .map((node: MetaTreeNode) => (node.name === 'user' ? { ...node, selectable: false } : node));
    },
    [model],
  );

  if (!model) {
    return null;
  }

  return (
    <FilterGroup
      value={filterValueRef.current}
      FilterItem={(itemProps) => (
        <FlowModelProvider model={model}>
          <VariableFilterItem
            {...itemProps}
            model={model}
            rightAsVariable
            rightMetaTree={rightMetaTree}
            rightVariableConverters={permissionVariableConverters}
          />
        </FlowModelProvider>
      )}
    />
  );
});

PermissionScopeFilter.displayName = 'PermissionScopeFilter';

function normalizeListResponse(response: any) {
  const payload = response?.data?.data;
  const rows = Array.isArray(payload) ? payload : payload?.data || payload?.rows || [];
  return {
    rows,
    total: payload?.count || payload?.total || response?.data?.meta?.count || rows.length,
    page: payload?.page,
    pageSize: payload?.pageSize,
  };
}

function getScopeValueKey(value: unknown) {
  if (value && typeof value === 'object') {
    const record = value as Partial<ScopeRecord>;
    return record.id ?? record.key;
  }
  return value as React.Key | undefined;
}

function isReadonlyScope(record?: ScopeRecord) {
  return record?.key === 'all' || record?.key === 'own';
}

function useDrawerTableLayoutStyles() {
  const { token } = theme.useToken();
  const contentClassName = useMemo(
    () => css`
      height: 100%;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `,
    [],
  );
  const toolbarClassName = useMemo(
    () => css`
      flex: 0 0 auto;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: ${token.marginSM}px;
      flex-wrap: wrap;
      margin-bottom: ${token.marginSM}px;
    `,
    [token.marginSM],
  );
  const tableClassName = useMemo(
    () => css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container {
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .ant-table-content,
      .ant-table-body {
        flex: 1;
        min-height: 0;
      }

      .ant-table-thead > tr > th {
        white-space: nowrap;
      }

      .ant-pagination {
        flex: 0 0 auto;
      }
    `,
    [],
  );

  return { contentClassName, tableClassName, toolbarClassName };
}

function getScopeRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Partial<ScopeRecord>) : undefined;
}

interface ScopeFormProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  initialValues?: Partial<ScopeRecord>;
  resourceName: string;
  onSubmitted: () => void;
  t: TFunction;
}

function ScopeForm(props: ScopeFormProps) {
  const ctx = useFlowContext<FlowEngineContext>();
  const [form] = Form.useForm();
  const filterPanelRef = useRef<PermissionScopeFilterRef>(null);
  const resource = useMemo(
    () =>
      ctx.api.resource(`dataSources/${props.dataSourceKey}/rolesResourcesScopes`) as unknown as CreateUpdateResource,
    [ctx.api, props.dataSourceKey],
  );

  async function handleSubmit() {
    const values = await form.validateFields();
    await saveScopeRecord(resource, {
      id: props.initialValues?.id,
      resourceName: props.resourceName,
      values,
      scope: filterPanelRef.current?.getFilter(),
    });
    props.onSubmitted();
  }

  return (
    <DrawerFormLayout
      title={props.initialValues?.id != null ? props.t('Edit record') : props.t('Add record')}
      onSubmit={handleSubmit}
      submitText={props.t('Submit')}
      cancelText={props.t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={props.initialValues}>
        <Form.Item
          name="name"
          label={props.t('Scope name')}
          rules={[{ required: true, message: props.t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={props.t('Data scope')}>
          <PermissionScopeFilter
            ref={filterPanelRef}
            collection={props.collection}
            initialValue={props.initialValues?.scope}
          />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

interface ScopePickerProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  resourceName: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  onClose: () => void;
  t: TFunction;
}

function ScopePicker(props: ScopePickerProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const { modal } = App.useApp();
  const [selectedRowKey, setSelectedRowKey] = useState<React.Key | undefined>(getScopeValueKey(props.value));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DATA_SCOPE_PAGE_SIZE);
  const resource = useMemo(
    () =>
      ctx.api.resource(`dataSources/${props.dataSourceKey}/rolesResourcesScopes`) as unknown as CreateUpdateResource &
        DestroyResource,
    [ctx.api, props.dataSourceKey],
  ) as CreateUpdateResource & DestroyResource & ListResource;
  const request = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        fields: ['id', 'key', 'name', 'resourceName', 'scope'],
        filter: {
          $or: [{ resourceName: props.resourceName }, { resourceName: null }],
        },
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [props.dataSourceKey, props.resourceName, page, pageSize],
    },
  );

  const records = request.data?.rows || [];
  const selectedRecord =
    records.find((record) => String(getScopeValueKey(record)) === String(selectedRowKey)) ||
    (props.value && typeof props.value === 'object' && String(getScopeValueKey(props.value)) === String(selectedRowKey)
      ? (props.value as ScopeRecord)
      : undefined);
  const { contentClassName, tableClassName, toolbarClassName } = useDrawerTableLayoutStyles();

  const openScopeForm = useMemoizedFn((record?: ScopeRecord) => {
    ctx.viewer.drawer({
      width: DATA_SCOPE_DRAWER_WIDTH,
      closable: true,
      content: () => (
        <ScopeForm
          collection={props.collection}
          dataSourceKey={props.dataSourceKey}
          resourceName={props.resourceName}
          initialValues={record}
          t={props.t}
          onSubmitted={() => {
            request.refresh();
          }}
        />
      ),
    });
  });

  const handleDelete = useMemoizedFn((record: ScopeRecord) => {
    modal.confirm({
      title: props.t('Delete record'),
      content: props.t('Are you sure you want to delete it?'),
      async onOk() {
        await destroyScopeRecord(resource, record.id);
        request.refresh();
      },
    });
  });

  const columns = useMemo<ColumnsType<ScopeRecord>>(
    () => [
      {
        title: props.t('Scope name'),
        dataIndex: 'name',
        width: token.sizeXXL * 5,
        ellipsis: true,
        render: (name) => compileLegacyTemplate(name, props.t),
      },
      {
        title: props.t('Actions'),
        width: token.sizeXXL * 4,
        render: (_, record) => {
          const disabled = isReadonlyScope(record);
          return (
            <Space size={token.marginXXS}>
              <Button
                type="link"
                size="small"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    openScopeForm(record);
                  }
                }}
              >
                {props.t('Edit')}
              </Button>
              <Button
                type="link"
                size="small"
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    handleDelete(record);
                  }
                }}
              >
                {props.t('Delete')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [handleDelete, openScopeForm, props, token.marginXXS, token.sizeXXL],
  );

  const pagination = useMemo<TablePaginationConfig>(
    () => ({
      current: request.data?.page ?? page,
      pageSize: request.data?.pageSize ?? pageSize,
      total: request.data?.total,
      onChange(nextPage, nextPageSize) {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    }),
    [page, pageSize, request.data?.page, request.data?.pageSize, request.data?.total],
  );

  return (
    <DrawerFormLayout
      title={props.t('Select record')}
      submitText={props.t('Submit')}
      cancelText={props.t('Cancel')}
      onSubmit={async () => {
        props.onChange?.(selectedRecord || null);
        props.onClose();
      }}
      footer={
        <Space>
          <Button onClick={props.onClose}>{props.t('Cancel')}</Button>
          <Button
            type="primary"
            onClick={() => {
              props.onChange?.(selectedRecord || null);
              props.onClose();
            }}
          >
            {props.t('Submit')}
          </Button>
        </Space>
      }
    >
      <div className={contentClassName}>
        <div className={toolbarClassName}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openScopeForm()}>
            {props.t('Add new')}
          </Button>
        </div>
        <Table<ScopeRecord>
          rowKey="id"
          showIndex={false}
          loading={request.loading}
          dataSource={records}
          columns={columns}
          pagination={pagination}
          scroll={{ x: 'max-content', y: '100%' }}
          className={tableClassName}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedRowKey == null ? [] : [selectedRowKey],
            onChange: (keys) => setSelectedRowKey(keys[0]),
          }}
        />
      </div>
    </DrawerFormLayout>
  );
}

export interface ScopeSelectProps {
  collection: Collection | undefined;
  dataSourceKey: string;
  resourceName: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  t: TFunction;
}

export function ScopeSelect(props: ScopeSelectProps) {
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const selectedRecordFromValue = getScopeRecord(props.value);
  const selectedKey = getScopeValueKey(props.value);
  const resource = useMemo(
    () => ctx.api.resource(`dataSources/${props.dataSourceKey}/rolesResourcesScopes`),
    [ctx.api, props.dataSourceKey],
  );
  const selectedRecordRequest = useRequest(
    async () => {
      if (selectedKey == null || selectedRecordFromValue?.name) {
        return selectedRecordFromValue;
      }
      const response = await resource.get({
        filterByTk: selectedKey,
      });
      return response?.data?.data as ScopeRecord | undefined;
    },
    {
      refreshDeps: [selectedKey, props.dataSourceKey],
      ready: selectedKey != null,
    },
  );
  const selectedRecord = selectedRecordFromValue?.name ? selectedRecordFromValue : selectedRecordRequest.data;
  const selectedName = selectedRecord?.name ? compileLegacyTemplateText(selectedRecord.name, props.t, '') : undefined;
  const selectedValue =
    selectedKey == null
      ? undefined
      : {
          label: selectedName || String(selectedKey),
          value: String(selectedKey),
        };

  const openPicker = useMemoizedFn(() => {
    ctx.viewer.drawer({
      width: DATA_SCOPE_DRAWER_WIDTH,
      closable: true,
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
      content: ({ close }) => <ScopePicker {...props} value={selectedRecord || props.value} onClose={close} />,
    });
  });

  return (
    <Tooltip title={selectedName}>
      <Select
        size="small"
        value={selectedValue}
        labelInValue
        popupMatchSelectWidth={false}
        open={false}
        placeholder={props.t('Select record')}
        options={selectedValue ? [selectedValue] : []}
        allowClear
        showSearch={false}
        style={{ minWidth: token.sizeXXL * 5 }}
        onClick={openPicker}
        onClear={() => {
          props.onChange?.(null);
        }}
      />
    </Tooltip>
  );
}
