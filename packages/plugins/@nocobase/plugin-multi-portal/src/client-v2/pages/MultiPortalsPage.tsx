/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DrawerFormLayout, IconPicker, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Flex, Form, Input, Radio, Select, Space, Switch, Tag, theme } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getPortalEntryActionStore } from '../entryActions/portalEntryActionStore';
import { useT } from '../locale';
import { getMultiPortalRouteUrl } from '../routeUrl';

type MultiPortalPrimaryKey = string;
type PortalSourceStorage = 'nocobase' | 'git';

type MultiPortalGitOptions = {
  branch?: string;
  path?: string;
  repo?: string;
};

type MultiPortalOptions = {
  git?: MultiPortalGitOptions;
  sourceStorage?: PortalSourceStorage;
};

export type MultiPortalRecord = MultiPortalFormValues & {
  defaultPortal?: boolean;
  uiLayout?: {
    layoutType?: string;
    title?: string;
    uid?: string;
  };
};

export type MultiPortalFormValues = {
  title: string;
  uid: string;
  portalType: string;
  portalName: string;
  routePath: string;
  uiLayoutUid?: string | null;
  icon?: string | null;
  enabled: boolean;
  options?: MultiPortalOptions;
};

type MultiPortalFormDraftValues = Omit<MultiPortalFormValues, 'routePath'> &
  Partial<Pick<MultiPortalFormValues, 'routePath'>> & {
    gitBranch?: string;
    gitPath?: string;
    gitRepo?: string;
    sourceStorage?: PortalSourceStorage;
  };

type MultiPortalListBody = {
  data?: MultiPortalRecord[];
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
  };
};

type UiLayoutOptionRecord = {
  layoutType?: string;
  title?: string;
  uid: string;
};

function getRecordProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return (value as Record<string, unknown>)[key];
}

function getStringMessage(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function getErrorMessage(error: unknown): string | undefined {
  const response = getRecordProperty(error, 'response');
  const data = getRecordProperty(response, 'data');
  const errors = getRecordProperty(data, 'errors');
  if (Array.isArray(errors)) {
    const message = errors
      .map((item) => getStringMessage(getRecordProperty(item, 'message')))
      .filter((item): item is string => Boolean(item))
      .join('\n');
    if (message) {
      return message;
    }
  }

  return (
    getStringMessage(getRecordProperty(getRecordProperty(data, 'error'), 'message')) ||
    getStringMessage(getRecordProperty(data, 'message')) ||
    getStringMessage(getRecordProperty(error, 'message'))
  );
}

export type MultiPortalResource = {
  create: (params: { values: MultiPortalFormValues }) => Promise<unknown>;
  update: (params: { filterByTk: MultiPortalPrimaryKey; values: MultiPortalFormValues }) => Promise<unknown>;
  destroy: (params: { filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[] }) => Promise<unknown>;
  list: (params: Record<string, unknown>) => Promise<{ data?: MultiPortalListBody }>;
};

export async function createMultiPortal(args: {
  resource: MultiPortalResource;
  values: MultiPortalFormValues;
  onSubmitted: () => void;
}) {
  await args.resource.create({ values: args.values });
  args.onSubmitted();
}

export async function updateMultiPortal(args: {
  resource: MultiPortalResource;
  filterByTk: MultiPortalPrimaryKey;
  values: MultiPortalFormValues;
  onSubmitted: () => void;
}) {
  await args.resource.update({ filterByTk: args.filterByTk, values: args.values });
  args.onSubmitted();
}

export async function deleteMultiPortals(args: {
  resource: MultiPortalResource;
  filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[];
  onDeleted: () => void;
}) {
  await args.resource.destroy({ filterByTk: args.filterByTk });
  args.onDeleted();
}

const DEFAULT_PORTAL_TYPE = 'no-code';
const PORTAL_TYPE_VALUES = ['no-code', 'ai'] as const;
const DEFAULT_PORTAL_SOURCE_STORAGE: PortalSourceStorage = 'nocobase';
const PORTAL_SOURCE_STORAGE_VALUES = ['nocobase', 'git'] as const;
const DEFAULT_PORTAL_GIT_BRANCH = 'main';
const DEFAULT_PORTAL_GIT_PATH = '';

const defaultFormValues: Pick<MultiPortalFormValues, 'portalType' | 'enabled'> = {
  portalType: DEFAULT_PORTAL_TYPE,
  enabled: true,
};

const actionLinkButtonStyle: React.CSSProperties = {
  paddingInline: 0,
};

const describedRadioStyle: React.CSSProperties = {
  alignItems: 'flex-start',
};

const describedRadioClassName = 'multi-portal-described-radio';
const describedRadioCss = `
.${describedRadioClassName} .ant-radio {
  align-self: flex-start;
  margin-top: 3px;
}
`;

const DEFAULT_PORTAL_UIDS = new Set(['__default_portal__']);
const portalSlugPattern = /^[a-z0-9_-]+$/;

const IconPickerFormControl = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof IconPicker>>(
  (props, ref) => (
    <div ref={ref}>
      <IconPicker {...props} />
    </div>
  ),
);

IconPickerFormControl.displayName = 'IconPickerFormControl';

function getMultiPortalNameFormatError(portalName?: string) {
  const trimmed = portalName?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!portalSlugPattern.test(trimmed)) {
    return 'Portal name can only contain lowercase letters, numbers, hyphens, and underscores';
  }
  return undefined;
}

function getMultiPortalRoutePathFromSlug(slug: string) {
  return `/${slug}`;
}

function normalizeMultiPortalIcon(icon?: string | null) {
  if (typeof icon !== 'string') {
    return null;
  }
  const trimmed = icon.trim();
  return trimmed || null;
}

function normalizeOptionalString(value?: string | null) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePortalType(value?: string | null) {
  const trimmed = normalizeOptionalString(value);
  if (trimmed && PORTAL_TYPE_VALUES.some((item) => item === trimmed)) {
    return trimmed;
  }
  return DEFAULT_PORTAL_TYPE;
}

function normalizePortalSourceStorage(value?: string | null): PortalSourceStorage {
  const trimmed = normalizeOptionalString(value);
  if (trimmed === 'nocobase' || trimmed === 'git') {
    return trimmed;
  }
  return DEFAULT_PORTAL_SOURCE_STORAGE;
}

function normalizeMultiPortalOptions(options?: MultiPortalOptions | null): MultiPortalOptions | undefined {
  if (!options || typeof options !== 'object') {
    return undefined;
  }

  const sourceStorage = normalizePortalSourceStorage(options.sourceStorage);
  if (sourceStorage !== 'git') {
    return { ...options, sourceStorage };
  }

  return {
    ...options,
    sourceStorage,
    git: {
      ...options.git,
      repo: normalizeOptionalString(options.git?.repo) || '',
      branch: normalizeOptionalString(options.git?.branch) || DEFAULT_PORTAL_GIT_BRANCH,
      path: normalizeOptionalString(options.git?.path) || DEFAULT_PORTAL_GIT_PATH,
    },
  };
}

function getSourceStorageOptionsFromDraft(values: MultiPortalFormDraftValues): MultiPortalOptions | undefined {
  if (normalizePortalType(values.portalType) !== 'ai') {
    return undefined;
  }

  const sourceStorage = normalizePortalSourceStorage(values.sourceStorage);
  if (sourceStorage !== 'git') {
    return { sourceStorage };
  }

  return {
    sourceStorage,
    git: {
      repo: (values.gitRepo ?? '').trim(),
      branch: normalizeOptionalString(values.gitBranch) || DEFAULT_PORTAL_GIT_BRANCH,
      path: normalizeOptionalString(values.gitPath) || DEFAULT_PORTAL_GIT_PATH,
    },
  };
}

function completeMultiPortalFormValues(values: MultiPortalFormDraftValues): MultiPortalFormValues {
  const portalName = values.portalName.trim();
  const portalNameError = getMultiPortalNameFormatError(portalName);
  if (portalNameError) {
    throw new Error(portalNameError);
  }
  return {
    ...values,
    title: values.title.trim(),
    uid: values.uid.trim(),
    portalType: normalizePortalType(values.portalType),
    portalName,
    routePath: getMultiPortalRoutePathFromSlug(portalName),
    icon: normalizeMultiPortalIcon(values.icon),
    options: getSourceStorageOptionsFromDraft(values),
  };
}

function getLayoutTagColor(layoutType?: string) {
  if (layoutType === 'desktop') {
    return 'blue';
  }
  if (layoutType === 'mobile') {
    return 'purple';
  }
  return 'default';
}

function getUiLayoutOptionLabel(item: UiLayoutOptionRecord, t: ReturnType<typeof useT>) {
  if (item.layoutType === 'desktop') {
    return t('Desktop');
  }
  if (item.layoutType === 'mobile') {
    return t('Mobile');
  }
  return item.title || item.uid;
}

function getDefaultUiLayoutUid(items?: UiLayoutOptionRecord[]) {
  return items?.find((item) => item.layoutType === 'desktop')?.uid;
}

function toFormValues(record: MultiPortalRecord): MultiPortalFormValues {
  const options = normalizeMultiPortalOptions(record.options);
  return {
    title: record.title,
    uid: record.uid,
    portalType: normalizePortalType(record.portalType),
    portalName: record.portalName,
    routePath: record.routePath,
    uiLayoutUid: record.uiLayoutUid || record.uiLayout?.uid || '',
    icon: record.icon ?? null,
    enabled: record.enabled,
    ...(options ? { options } : {}),
  };
}

function toFormDraftValues(record: MultiPortalRecord): MultiPortalFormDraftValues {
  const values = toFormValues(record);
  const options = values.options;
  return {
    ...values,
    sourceStorage: normalizePortalSourceStorage(options?.sourceStorage),
    gitRepo: options?.git?.repo || '',
    gitBranch: options?.git?.branch || DEFAULT_PORTAL_GIT_BRANCH,
    gitPath: options?.git?.path || DEFAULT_PORTAL_GIT_PATH,
  };
}

function withDefaultPortalFlag(record: MultiPortalRecord): MultiPortalRecord {
  return {
    ...record,
    defaultPortal: DEFAULT_PORTAL_UIDS.has(record.uid),
  };
}

const MultiPortalsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<MultiPortalPrimaryKey[]>([]);
  const [updatingEnabledRowKeys, setUpdatingEnabledRowKeys] = useState<MultiPortalPrimaryKey[]>([]);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);

  const listRequest = useRequest(async (page = 1): Promise<MultiPortalListBody> => {
    const response = await resource.list({
      page,
      pageSize: 20,
      sort: ['createdAt'],
      appends: ['uiLayout'],
    });
    return response?.data ?? { data: [] };
  });
  const { data: listResp, loading } = listRequest;
  const records = useMemo(() => {
    return Array.isArray(listResp?.data) ? listResp.data.map(withDefaultPortalFlag) : [];
  }, [listResp?.data]);
  const pagination = useMemo(() => {
    const meta = listResp?.meta;
    if (!meta) return false as const;
    return {
      total: meta.count ?? records.length,
      pageSize: meta.pageSize ?? 20,
      current: meta.page ?? 1,
    };
  }, [listResp?.meta, records.length]);

  const refreshList = useCallback(() => {
    setSelectedRowKeys([]);
    listRequest.run(listResp?.meta?.page ?? 1);
  }, [listRequest, listResp?.meta?.page]);
  const refreshEntryActions = useCallback(() => {
    getPortalEntryActionStore(ctx.app)
      .reload(ctx.api)
      .catch((error) => {
        console.error('[NocoBase] Failed to refresh portal entry actions.', error);
      });
  }, [ctx.api, ctx.app]);
  const refreshPortals = useCallback(() => {
    refreshList();
    refreshEntryActions();
  }, [refreshEntryActions, refreshList]);

  const openFormDrawer = useCallback(
    (record?: MultiPortalRecord) => {
      ctx.viewer.drawer({
        width: token.screenMD,
        closable: true,
        content: () => <MultiPortalForm record={record} onSubmitted={refreshPortals} />,
      });
    },
    [ctx.viewer, refreshPortals, token.screenMD],
  );

  const handleDelete = useCallback(
    (filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[], options: { isBatch?: boolean } = {}) => {
      modal.confirm({
        title: t('Delete portal'),
        content: (
          <>
            <div>
              {options.isBatch
                ? t('Are you sure you want to delete the selected Multi-portal records?')
                : t('Are you sure you want to delete it?')}
            </div>
            <div>{t('The corresponding portal directory will also be deleted.')}</div>
          </>
        ),
        async onOk() {
          await deleteMultiPortals({
            resource,
            filterByTk,
            onDeleted: refreshPortals,
          });
        },
      });
    },
    [modal, refreshPortals, resource, t],
  );

  const handleToggleEnabled = useCallback(
    async (record: MultiPortalRecord, enabled: boolean) => {
      setUpdatingEnabledRowKeys((keys) => (keys.includes(record.uid) ? keys : [...keys, record.uid]));
      try {
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values: {
            ...toFormValues(record),
            enabled,
          },
          onSubmitted: refreshPortals,
        });
        message.success(t('Updated successfully'));
      } finally {
        setUpdatingEnabledRowKeys((keys) => keys.filter((key) => key !== record.uid));
      }
    },
    [message, refreshPortals, resource, t],
  );

  const columns = useMemo<ColumnsType<MultiPortalRecord>>(
    () => [
      { title: t('Title'), dataIndex: 'title', ellipsis: true },
      {
        title: t('Access path'),
        dataIndex: 'routePath',
        ellipsis: true,
        render: (_value, record) => {
          const href = getMultiPortalRouteUrl(ctx.app, record.routePath, record.portalType);
          return (
            <Button type="link" href={href} target="_blank" rel="noopener noreferrer" style={actionLinkButtonStyle}>
              {href}
            </Button>
          );
        },
      },
      { title: t('Portal name'), dataIndex: 'portalName', ellipsis: true },
      {
        title: t('Layout'),
        dataIndex: 'uiLayoutUid',
        ellipsis: true,
        render: (_value, record) => {
          const layoutLabel = record.uiLayout?.title || record.uiLayoutUid;
          return layoutLabel ? <Tag color={getLayoutTagColor(record.uiLayout?.layoutType)}>{layoutLabel}</Tag> : null;
        },
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean, record) => (
          <Switch
            aria-label={t('Enabled')}
            checked={value}
            loading={updatingEnabledRowKeys.includes(record.uid)}
            size="small"
            onChange={async (checked) => {
              await handleToggleEnabled(record, checked);
            }}
          />
        ),
      },
      {
        title: t('Actions'),
        render: (_: unknown, record) => (
          <Space size="small">
            <Button
              type="link"
              href={getMultiPortalRouteUrl(ctx.app, record.routePath, record.portalType)}
              target="_blank"
              rel="noopener noreferrer"
              style={actionLinkButtonStyle}
            >
              {t('View')}
            </Button>
            <Button type="link" style={actionLinkButtonStyle} onClick={() => openFormDrawer(record)}>
              {t('Edit')}
            </Button>
            <Button type="link" style={actionLinkButtonStyle} onClick={() => handleDelete(record.uid)}>
              {t('Delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [ctx.app, handleDelete, handleToggleEnabled, openFormDrawer, t, updatingEnabledRowKeys],
  );

  const handleTableChange = useCallback<NonNullable<TableProps<MultiPortalRecord>['onChange']>>(
    (tablePagination) => {
      listRequest.run(tablePagination.current ?? 1);
    },
    [listRequest],
  );

  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshPortals}>
            {t('Refresh')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleDelete(selectedRowKeys, { isBatch: true })}
          >
            {t('Delete')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormDrawer()}>
            {t('Add portal')}
          </Button>
        </Space>
      </Flex>
      <Table<MultiPortalRecord>
        rowKey="uid"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as MultiPortalPrimaryKey[]),
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

function MultiPortalForm(props: { record?: MultiPortalRecord; onSubmitted: () => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { notification } = App.useApp();
  const [form] = Form.useForm<MultiPortalFormDraftValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);
  const layoutOptionsService = useRequest(async () => {
    const response = await ctx.api.request<{ data?: UiLayoutOptionRecord[] }>({
      url: 'uiLayouts:listEnabled',
      method: 'get',
      params: {
        pageSize: 200,
        sort: ['uid'],
      },
      skipNotify: true,
    });
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  });
  const layoutOptions = useMemo(
    () =>
      (layoutOptionsService.data ?? []).map((item) => ({
        value: item.uid,
        label: getUiLayoutOptionLabel(item, t),
      })),
    [layoutOptionsService.data, t],
  );
  useEffect(() => {
    if (record || form.getFieldValue('uiLayoutUid')) {
      return;
    }
    const defaultUiLayoutUid = getDefaultUiLayoutUid(layoutOptionsService.data);
    if (defaultUiLayoutUid) {
      form.setFieldValue('uiLayoutUid', defaultUiLayoutUid);
    }
  }, [form, layoutOptionsService.data, record]);
  const initialValues = useMemo<Partial<MultiPortalFormDraftValues>>(
    () =>
      record
        ? toFormDraftValues(record)
        : {
            ...defaultFormValues,
            uid: `portal-${randomId()}`,
            sourceStorage: DEFAULT_PORTAL_SOURCE_STORAGE,
            gitBranch: DEFAULT_PORTAL_GIT_BRANCH,
            gitPath: DEFAULT_PORTAL_GIT_PATH,
          },
    [record],
  );

  const handleSubmit = useCallback(async () => {
    const values = completeMultiPortalFormValues(await form.validateFields());
    setSubmitting(true);
    try {
      if (record) {
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values,
          onSubmitted,
        });
      } else {
        await createMultiPortal({
          resource,
          values,
          onSubmitted,
        });
      }
    } catch (error) {
      notification.error({
        message: getErrorMessage(error) || t('Failed to save portal'),
        role: 'alert',
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [form, notification, onSubmitted, record, resource, t]);

  return (
    <DrawerFormLayout
      title={record ? t('Edit portal') : t('Add portal')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <style>{describedRadioCss}</style>
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="title"
          label={t('Title')}
          rules={[{ required: true, whitespace: true, message: t('Title field is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="uid"
          hidden
          rules={[{ required: true, whitespace: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="portalName"
          label={t('Portal name')}
          rules={[
            { required: true, whitespace: true, message: t('The field value is required') },
            {
              validator: (_, value?: string) => {
                const error = getMultiPortalNameFormatError(value);
                return error ? Promise.reject(new Error(t(error))) : Promise.resolve();
              },
            },
          ]}
        >
          <Input disabled={record?.defaultPortal} />
        </Form.Item>
        <Form.Item
          name="portalType"
          label={t('Portal type')}
          htmlFor="multi-portal-portal-type-no-code"
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Radio.Group disabled={record?.defaultPortal}>
            <Space direction="vertical">
              <Radio
                className={describedRadioClassName}
                id="multi-portal-portal-type-no-code"
                style={describedRadioStyle}
                value="no-code"
              >
                <span>{t('No-code portal')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Create with visual configuration. AI can help adjust the configuration. Path: /v/<name>')}
                </div>
              </Radio>
              <Radio className={describedRadioClassName} style={describedRadioStyle} value="ai">
                <span>{t('AI portal')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Create with AI Agent and code. Users can request changes in natural language. Path: /x/<name>')}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, next) => prev.portalType !== next.portalType}>
          {({ getFieldValue }) =>
            getFieldValue('portalType') === 'ai' ? (
              <>
                <Form.Item
                  name="sourceStorage"
                  label={t('Source storage')}
                  htmlFor="multi-portal-source-storage-nocobase"
                  rules={[{ required: true, message: t('The field value is required') }]}
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio
                        className={describedRadioClassName}
                        id="multi-portal-source-storage-nocobase"
                        style={describedRadioStyle}
                        value="nocobase"
                      >
                        <span>{t('NocoBase')}</span>
                        <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                          {t('Manage portal source code in NocoBase.')}
                        </div>
                      </Radio>
                      <Radio className={describedRadioClassName} style={describedRadioStyle} value="git">
                        <span>{t('Git')}</span>
                        <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                          {t('Manage portal source code in a Git repository.')}
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
                <Form.Item noStyle shouldUpdate={(prev, next) => prev.sourceStorage !== next.sourceStorage}>
                  {({ getFieldValue: getStorageFieldValue }) =>
                    getStorageFieldValue('sourceStorage') === 'git' ? (
                      <>
                        <Form.Item
                          name="gitRepo"
                          label={t('Git repository URL')}
                          rules={[{ required: true, whitespace: true, message: t('The field value is required') }]}
                        >
                          <Input placeholder="git@github.com:nocobase/customer-portal.git" />
                        </Form.Item>
                        <Form.Item name="gitBranch" label={t('Git branch')}>
                          <Input placeholder={DEFAULT_PORTAL_GIT_BRANCH} />
                        </Form.Item>
                        <Form.Item
                          name="gitPath"
                          label={t('Git path')}
                          extra={t('Directory inside the Git repository for this portal. Leave empty for the root.')}
                        >
                          <Input placeholder={DEFAULT_PORTAL_GIT_PATH} />
                        </Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>
              </>
            ) : null
          }
        </Form.Item>
        <Form.Item
          name="uiLayoutUid"
          label={t('Layout')}
          dependencies={['portalType']}
          rules={[
            {
              validator: (_, value?: string | null) => {
                if (form.getFieldValue('portalType') !== 'ai' && !value) {
                  return Promise.reject(new Error(t('The field value is required')));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            disabled={!!record || record?.defaultPortal}
            loading={layoutOptionsService.loading}
            options={layoutOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="icon" label={t('Icon')}>
          <IconPickerFormControl />
        </Form.Item>
        <Form.Item
          name="enabled"
          label={t('Enabled')}
          valuePropName="checked"
          extra={t('When disabled, this portal will not be registered or accessible.')}
        >
          <Switch />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default MultiPortalsPage;
