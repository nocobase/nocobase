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
import { Alert, App, Button, Card, Flex, Form, Input, Radio, Select, Space, Switch, Tag, theme } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPortalEntryActionStore } from '../entryActions/portalEntryActionStore';
import { useT } from '../locale';
import { getMultiPortalRouteUrl } from '../routeUrl';

type MultiPortalPrimaryKey = string;

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
  developmentMode: string;
  routeName: string;
  routePath: string;
  uiLayoutUid?: string | null;
  icon?: string | null;
  enabled: boolean;
};

type MultiPortalFormDraftValues = Omit<MultiPortalFormValues, 'routePath'> &
  Partial<Pick<MultiPortalFormValues, 'routePath'>>;

type MultiPortalListBody = {
  data?: MultiPortalRecord[];
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
  };
};
type MultiPortalLogBody = {
  content?: string;
  path?: string;
};
type MultiPortalLogResponseBody = {
  data?: MultiPortalLogBody;
};

type UiLayoutOptionRecord = {
  layoutType?: string;
  title?: string;
  uid: string;
};

export type MultiPortalResource = {
  create: (params: { values: MultiPortalFormValues }) => Promise<unknown>;
  update: (params: { filterByTk: MultiPortalPrimaryKey; values: MultiPortalFormValues }) => Promise<unknown>;
  destroy: (params: { filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[] }) => Promise<unknown>;
  getLog: (params: { filterByTk: MultiPortalPrimaryKey }) => Promise<{ data?: MultiPortalLogResponseBody }>;
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

const DEFAULT_DEVELOPMENT_MODE = 'no-code';
const DEVELOPMENT_MODE_VALUES = ['no-code', 'vibe-coding'] as const;
const PORTAL_LOG_POLLING_INTERVAL = 1000;
const ansiSgrPattern = new RegExp(`(?:${String.fromCharCode(27)}\\[[0-9;]*m|\\[[0-9;]+m)`, 'g');

const defaultFormValues: Pick<MultiPortalFormValues, 'developmentMode' | 'enabled'> = {
  developmentMode: DEFAULT_DEVELOPMENT_MODE,
  enabled: true,
};

const actionLinkButtonStyle: React.CSSProperties = {
  paddingInline: 0,
};

const DEFAULT_PORTAL_UIDS = new Set(['__default_admin__', '__default_admin_vibe_coding__', '__default_mobile__']);
const portalSlugPattern = /^[a-z0-9_-]+$/;

const IconPickerFormControl = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof IconPicker>>(
  (props, ref) => (
    <div ref={ref}>
      <IconPicker {...props} />
    </div>
  ),
);

IconPickerFormControl.displayName = 'IconPickerFormControl';

function getMultiPortalRouteNameFormatError(routeName?: string) {
  const trimmed = routeName?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!portalSlugPattern.test(trimmed)) {
    return 'Portal slug can only contain lowercase letters, numbers, hyphens, and underscores';
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

function normalizeDevelopmentMode(value?: string | null) {
  const trimmed = normalizeOptionalString(value);
  if (trimmed && DEVELOPMENT_MODE_VALUES.some((item) => item === trimmed)) {
    return trimmed;
  }
  return DEFAULT_DEVELOPMENT_MODE;
}

function completeMultiPortalFormValues(values: MultiPortalFormDraftValues): MultiPortalFormValues {
  const routeName = values.routeName.trim();
  const routeNameError = getMultiPortalRouteNameFormatError(routeName);
  if (routeNameError) {
    throw new Error(routeNameError);
  }
  return {
    ...values,
    title: values.title.trim(),
    uid: values.uid.trim(),
    developmentMode: normalizeDevelopmentMode(values.developmentMode),
    routeName,
    routePath: getMultiPortalRoutePathFromSlug(routeName),
    icon: normalizeMultiPortalIcon(values.icon),
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
  return {
    title: record.title,
    uid: record.uid,
    developmentMode: normalizeDevelopmentMode(record.developmentMode),
    routeName: record.routeName,
    routePath: record.routePath,
    uiLayoutUid: record.uiLayoutUid || record.uiLayout?.uid || '',
    icon: record.icon ?? null,
    enabled: record.enabled,
  };
}

function withDefaultPortalFlag(record: MultiPortalRecord): MultiPortalRecord {
  return {
    ...record,
    defaultPortal: DEFAULT_PORTAL_UIDS.has(record.uid),
  };
}

function getErrorMessage(error: unknown) {
  const apiError = error as
    | {
        response?: {
          data?: {
            errors?: Array<{ message?: unknown }>;
            message?: unknown;
          };
        };
        message?: unknown;
      }
    | undefined;
  const responseMessage = apiError?.response?.data?.errors?.find((item) => typeof item.message === 'string')?.message;
  if (typeof responseMessage === 'string' && responseMessage) {
    return responseMessage;
  }
  const dataMessage = apiError?.response?.data?.message;
  if (typeof dataMessage === 'string' && dataMessage) {
    return dataMessage;
  }
  const errorMessage = apiError?.message;
  if (typeof errorMessage === 'string' && errorMessage) {
    return errorMessage;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return undefined;
}

type AnsiLogPalette = {
  black: string;
  blue: string;
  cyan: string;
  green: string;
  magenta: string;
  red: string;
  white: string;
  yellow: string;
};

type AnsiLogStyleState = Pick<React.CSSProperties, 'color' | 'fontWeight' | 'opacity'>;

function getAnsiLogTokenCodes(token: string) {
  const tokenBody = token.startsWith('\u001b[') ? token.slice(2, -1) : token.slice(1, -1);
  if (!tokenBody) {
    return [0];
  }
  return tokenBody
    .split(';')
    .map((part) => Number(part))
    .filter((code) => Number.isFinite(code));
}

function getAnsiLogColor(code: number, palette: AnsiLogPalette) {
  switch (code) {
    case 30:
    case 90:
      return palette.black;
    case 31:
    case 91:
      return palette.red;
    case 32:
    case 92:
      return palette.green;
    case 33:
    case 93:
      return palette.yellow;
    case 34:
    case 94:
      return palette.blue;
    case 35:
    case 95:
      return palette.magenta;
    case 36:
    case 96:
      return palette.cyan;
    case 37:
    case 97:
      return palette.white;
    default:
      return undefined;
  }
}

function getNextAnsiLogStyleState(
  state: AnsiLogStyleState,
  codes: number[],
  palette: AnsiLogPalette,
): AnsiLogStyleState {
  return codes.reduce<AnsiLogStyleState>((nextState, code) => {
    if (code === 0) {
      return {};
    }
    if (code === 1) {
      return {
        ...nextState,
        fontWeight: 600,
      };
    }
    if (code === 2) {
      return {
        ...nextState,
        opacity: 0.72,
      };
    }
    if (code === 22) {
      const restState = { ...nextState };
      delete restState.fontWeight;
      delete restState.opacity;
      return restState;
    }
    if (code === 39) {
      const restState = { ...nextState };
      delete restState.color;
      return restState;
    }
    const color = getAnsiLogColor(code, palette);
    if (color) {
      return {
        ...nextState,
        color,
      };
    }
    return nextState;
  }, state);
}

export function renderAnsiLogContent(content: string, palette: AnsiLogPalette): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let styleState: AnsiLogStyleState = {};
  let currentIndex = 0;

  content.replace(ansiSgrPattern, (token, offset: number) => {
    if (offset > currentIndex) {
      const text = content.slice(currentIndex, offset);
      nodes.push(
        Object.keys(styleState).length > 0 ? (
          <span key={`ansi-log-${nodes.length}`} style={styleState}>
            {text}
          </span>
        ) : (
          text
        ),
      );
    }

    styleState = getNextAnsiLogStyleState(styleState, getAnsiLogTokenCodes(token), palette);
    currentIndex = offset + token.length;
    return token;
  });

  if (currentIndex < content.length) {
    const text = content.slice(currentIndex);
    nodes.push(
      Object.keys(styleState).length > 0 ? (
        <span key={`ansi-log-${nodes.length}`} style={styleState}>
          {text}
        </span>
      ) : (
        text
      ),
    );
  }

  return nodes;
}

export function PortalLogsViewer(props: {
  portalUid: MultiPortalPrimaryKey;
  resource: MultiPortalResource;
  pollingInterval?: number;
}) {
  const { pollingInterval = PORTAL_LOG_POLLING_INTERVAL, portalUid, resource } = props;
  const t = useT();
  const { token } = theme.useToken();
  const logRef = useRef<HTMLPreElement>(null);
  const logRequest = useRequest(
    async () => {
      const response = await resource.getLog({ filterByTk: portalUid });
      return response.data?.data ?? {};
    },
    {
      pollingInterval,
      pollingWhenHidden: false,
    },
  );
  const log = logRequest.data;
  const content = log?.content || t('No logs yet');
  const logContent = useMemo(
    () =>
      renderAnsiLogContent(content, {
        black: token.colorTextTertiary,
        blue: token.colorInfo,
        cyan: token.cyan6,
        green: token.colorSuccess,
        magenta: token.magenta6,
        red: token.colorError,
        white: token.colorText,
        yellow: token.colorWarning,
      }),
    [
      content,
      token.colorError,
      token.colorInfo,
      token.colorSuccess,
      token.colorText,
      token.colorTextTertiary,
      token.colorWarning,
      token.cyan6,
      token.magenta6,
    ],
  );

  useEffect(() => {
    const logElement = logRef.current;
    if (logElement) {
      logElement.scrollTop = logElement.scrollHeight;
    }
  }, [content]);

  return (
    <div>
      {logRequest.error && (
        <Alert
          type="warning"
          showIcon
          message={getErrorMessage(logRequest.error) || t('Failed to load portal logs')}
          style={{ marginBottom: token.marginSM }}
        />
      )}
      {log?.path && <div style={{ marginBottom: token.marginSM }}>{log.path}</div>}
      <pre
        ref={logRef}
        aria-busy={logRequest.loading}
        aria-live="polite"
        style={{
          background: token.colorFillQuaternary,
          borderRadius: token.borderRadiusSM,
          color: token.colorText,
          fontFamily: token.fontFamilyCode,
          fontSize: token.fontSizeSM,
          lineHeight: token.lineHeightSM,
          margin: 0,
          maxHeight: '60vh',
          overflow: 'auto',
          padding: token.paddingSM,
          whiteSpace: 'pre',
        }}
      >
        {logContent}
      </pre>
    </div>
  );
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

  const handleViewLog = useCallback(
    (record: MultiPortalRecord) => {
      modal.info({
        title: t('Portal logs'),
        width: 800,
        content: <PortalLogsViewer portalUid={record.uid} resource={resource} />,
      });
    },
    [modal, resource, t],
  );

  const columns = useMemo<ColumnsType<MultiPortalRecord>>(
    () => [
      { title: t('Title'), dataIndex: 'title', ellipsis: true },
      {
        title: t('Access path'),
        dataIndex: 'routePath',
        ellipsis: true,
        render: (_value, record) => {
          const href = getMultiPortalRouteUrl(ctx.app, record.routePath, record.developmentMode);
          return (
            <Button type="link" href={href} target="_blank" rel="noopener noreferrer" style={actionLinkButtonStyle}>
              {href}
            </Button>
          );
        },
      },
      { title: t('Portal slug'), dataIndex: 'routeName', ellipsis: true },
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
            disabled={record.defaultPortal}
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
              href={getMultiPortalRouteUrl(ctx.app, record.routePath, record.developmentMode)}
              target="_blank"
              rel="noopener noreferrer"
              style={actionLinkButtonStyle}
            >
              {t('View')}
            </Button>
            {record.developmentMode === 'vibe-coding' && (
              <Button type="link" style={actionLinkButtonStyle} onClick={() => handleViewLog(record)}>
                {t('Logs')}
              </Button>
            )}
            <Button type="link" style={actionLinkButtonStyle} onClick={() => openFormDrawer(record)}>
              {t('Edit')}
            </Button>
            {!record.defaultPortal && (
              <Button type="link" style={actionLinkButtonStyle} onClick={() => handleDelete(record.uid)}>
                {t('Delete')}
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [ctx.app, handleDelete, handleToggleEnabled, handleViewLog, openFormDrawer, t, updatingEnabledRowKeys],
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
          getCheckboxProps: (record) => ({
            disabled: record.defaultPortal,
          }),
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
        ? toFormValues(record)
        : {
            ...defaultFormValues,
            uid: `portal-${randomId()}`,
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
          name="routeName"
          label={t('Portal slug')}
          rules={[
            { required: true, whitespace: true, message: t('The field value is required') },
            {
              validator: (_, value?: string) => {
                const error = getMultiPortalRouteNameFormatError(value);
                return error ? Promise.reject(new Error(t(error))) : Promise.resolve();
              },
            },
          ]}
        >
          <Input disabled={record?.defaultPortal} />
        </Form.Item>
        <Form.Item
          name="developmentMode"
          label={t('Development mode')}
          htmlFor="multi-portal-development-mode-no-code"
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Radio.Group disabled={record?.defaultPortal}>
            <Space direction="vertical">
              <Radio id="multi-portal-development-mode-no-code" value="no-code">
                <span>{t('Human-led development')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Build your application using configuration and low-code tools, with AI as your assistant.')}
                </div>
              </Radio>
              <Radio value="vibe-coding">
                <span>{t('AI-led development')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('You describe what you need, and AI writes the code and builds the application for you.')}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="uiLayoutUid"
          label={t('Layout')}
          dependencies={['developmentMode']}
          rules={[
            {
              validator: (_, value?: string | null) => {
                if (form.getFieldValue('developmentMode') !== 'vibe-coding' && !value) {
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
          <Switch disabled={record?.defaultPortal} />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default MultiPortalsPage;
