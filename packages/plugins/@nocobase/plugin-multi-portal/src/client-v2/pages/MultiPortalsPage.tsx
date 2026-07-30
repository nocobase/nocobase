/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { AttachmentUpload, DrawerFormLayout, Icon, IconPicker, type UploadedAttachment } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import {
  App,
  Badge,
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  Pagination,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isDefaultLayoutMultiPortalUid } from '../../constants';
import { getPortalEntryActionStore } from '../entryActions/portalEntryActionStore';
import { useT } from '../locale';
import { getMultiPortalRouteUrl } from '../routeUrl';
import PortalRoutesDrawer from './PortalRoutesDrawer';

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
  /** 画廊封面附件，空值时回落到自动生成的渐变封面 */
  cover?: UploadedAttachment | null;
};

export type MultiPortalRecord = MultiPortalFormValues & {
  isDefault?: boolean | null;
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
    setAsDefault?: boolean;
    sourceStorage?: PortalSourceStorage;
    cover?: UploadedAttachment | null;
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
  setDefault: (params: { filterByTk: MultiPortalPrimaryKey }) => Promise<unknown>;
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
  setAsDefault?: boolean;
  onSubmitted: () => void;
}) {
  await args.resource.update({ filterByTk: args.filterByTk, values: args.values });
  if (args.setAsDefault) {
    await args.resource.setDefault({ filterByTk: args.filterByTk });
  }
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

export async function setDefaultMultiPortal(args: {
  resource: MultiPortalResource;
  filterByTk: MultiPortalPrimaryKey;
  onSubmitted: () => void;
}) {
  await args.resource.setDefault({ filterByTk: args.filterByTk });
  args.onSubmitted();
}

const DEFAULT_PORTAL_TYPE = 'no-code';
// 新建时默认落在 AI portal——这是现在主推的建站方式；历史记录仍按 no-code 兜底。
const NEW_PORTAL_DEFAULT_TYPE = 'ai';
const PORTAL_TYPE_VALUES = ['no-code', 'ai'] as const;
const DEFAULT_PORTAL_SOURCE_STORAGE: PortalSourceStorage = 'nocobase';
const DEFAULT_PORTAL_GIT_BRANCH = 'main';
const DEFAULT_PORTAL_GIT_PATH = '';

const defaultFormValues: Pick<MultiPortalFormValues, 'portalType' | 'enabled'> = {
  portalType: DEFAULT_PORTAL_TYPE,
  enabled: true,
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

function getSourceStorageOptionsFromDraft(values: MultiPortalFormDraftValues): MultiPortalOptions {
  // options 是自由结构的 json 列，表单只管其中几个字段；其余内容原样带上，别在提交时冲掉。
  const baseOptions = values.options || {};
  const cover = values.cover || null;

  if (normalizePortalType(values.portalType) !== 'ai') {
    // 非 AI portal 的表单里没有源码位置，保留记录上的既有值。
    return { ...baseOptions, cover };
  }

  const sourceStorage = normalizePortalSourceStorage(values.sourceStorage);
  if (sourceStorage !== 'git') {
    // 切回 NocoBase 只改存储位置，既有 git 配置留着，再切回 git 时不用重输分支和路径。
    return { ...baseOptions, cover, sourceStorage };
  }

  return {
    ...baseOptions,
    cover,
    sourceStorage,
    git: {
      ...baseOptions.git,
      repo: normalizeOptionalString(values.gitRepo) || '',
      branch: normalizeOptionalString(values.gitBranch) || DEFAULT_PORTAL_GIT_BRANCH,
      path: normalizeOptionalString(values.gitPath) || DEFAULT_PORTAL_GIT_PATH,
    },
  };
}

/**
 * 从 git 仓库地址里取出仓库名。
 *
 * 支持 `git@host:org/repo.git`、`https://host/org/repo(.git)`、以及末尾多余的斜杠。
 *
 * @param {string | undefined} repo 仓库地址
 * @returns {string | undefined} 仓库名
 */
export function getRepoNameFromGitUrl(repo?: string | null) {
  const trimmed = (repo || '')
    .trim()
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  if (!trimmed) {
    return undefined;
  }

  const lastSegment = trimmed.split(/[/:]/).filter(Boolean).pop();
  return lastSegment || undefined;
}

/**
 * 由 git 仓库地址推导 portal 的标题和名称。
 *
 * 只是给用户省一次输入，两个字段推导完仍然可改。
 *
 * @param {string | undefined} repo 仓库地址
 * @returns {{ portalName: string; title: string } | undefined} 推导结果
 */
export function derivePortalNamingFromGitUrl(repo?: string | null) {
  const repoName = getRepoNameFromGitUrl(repo);
  if (!repoName) {
    return undefined;
  }

  const portalName = repoName
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!portalName) {
    return undefined;
  }

  const title = portalName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { portalName, title: title || portalName };
}

function completeMultiPortalFormValues(values: MultiPortalFormDraftValues): MultiPortalFormValues {
  const portalName = values.portalName.trim();
  const portalNameError = getMultiPortalNameFormatError(portalName);
  if (portalNameError) {
    throw new Error(portalNameError);
  }
  // cover / sourceStorage / git* 只是表单里的中间态，最终都收进 options，不能作为顶层列提交。
  const {
    cover: _cover,
    gitBranch: _gitBranch,
    gitPath: _gitPath,
    gitRepo: _gitRepo,
    setAsDefault: _setAsDefault,
    sourceStorage: _sourceStorage,
    ...columnValues
  } = values;
  const portalType = normalizePortalType(values.portalType);
  return {
    ...columnValues,
    title: values.title.trim(),
    uid: values.uid.trim(),
    portalType,
    portalName,
    routePath: getMultiPortalRoutePathFromSlug(portalName),
    icon: normalizeMultiPortalIcon(values.icon),
    options: getSourceStorageOptionsFromDraft(values),
  };
}

// 设置中心走中性灰白，标签统一用默认色，靠文案而不是颜色区分。
function getLayoutTagColor(_layoutType?: string) {
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
  // 只有源码确实存在 git 上时才回填仓库地址：记录里可能留着上一次切走时的 git 配置，
  // 无条件回填会让"已经切回 NocoBase"的地址重新冒出来。
  const sourceStorage = normalizePortalSourceStorage(options?.sourceStorage);
  return {
    ...values,
    sourceStorage,
    gitRepo: sourceStorage === 'git' ? options?.git?.repo || '' : '',
    gitBranch: options?.git?.branch || DEFAULT_PORTAL_GIT_BRANCH,
    gitPath: options?.git?.path || DEFAULT_PORTAL_GIT_PATH,
    cover: options?.cover || null,
  };
}

function isFixedDefaultPortal(record?: MultiPortalRecord) {
  return isDefaultLayoutMultiPortalUid(record?.uid);
}

const PORTAL_COVER_HEIGHT = 132;

const galleryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))',
};

/**
 * 由字符串派生一个稳定的散列值。
 *
 * 用来给每个 portal 生成固定的默认封面，刷新列表不会换色。
 *
 * @param {string} value 输入字符串
 * @returns {number} 非负散列值
 */
function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 生成 portal 的默认封面底色。
 *
 * 设置中心整体是中性灰白，封面因此走低饱和度的柔和渐变：
 * 既能让画廊里的每张卡片彼此可区分，又不会把页面拉回彩色。
 *
 * @param {string} seed 生成种子（portal uid）
 * @param {boolean} dark 是否深色主题
 * @returns {string} CSS 渐变
 */
function getPortalCoverBackground(seed: string, dark: boolean) {
  const hue = hashString(seed) % 360;
  if (dark) {
    return `linear-gradient(135deg, hsl(${hue}, 14%, 26%) 0%, hsl(${(hue + 40) % 360}, 16%, 18%) 100%)`;
  }
  return `linear-gradient(135deg, hsl(${hue}, 26%, 93%) 0%, hsl(${(hue + 40) % 360}, 22%, 85%) 100%)`;
}

/**
 * 判断当前是否深色主题。
 *
 * @param {string} color 容器底色
 * @returns {boolean} 是否深色
 */
function isDarkThemeColor(color?: string) {
  const hex = (color || '').trim().replace('#', '');
  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
    return false;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function PortalCover(props: { record: MultiPortalRecord; defaultLabel: string }) {
  const { record } = props;
  const { defaultLabel } = props;
  const { token } = theme.useToken();
  const dark = isDarkThemeColor(token.colorBgContainer);
  const background = getPortalCoverBackground(record.uid || record.portalName || '', dark);
  const initial = (record.title || record.portalName || '?').trim().charAt(0).toUpperCase();
  const coverUrl = record.options?.cover?.url;
  const coverBorderRadius = `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`;

  const cover = coverUrl ? (
    <div
      aria-hidden
      style={{
        background: `${token.colorFillQuaternary} center / cover no-repeat url("${coverUrl}")`,
        borderRadius: coverBorderRadius,
        height: PORTAL_COVER_HEIGHT,
      }}
    />
  ) : (
    <div
      aria-hidden
      style={{
        alignItems: 'center',
        background,
        borderRadius: coverBorderRadius,
        display: 'flex',
        height: PORTAL_COVER_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {record.icon ? (
        <Icon type={record.icon} style={{ color: token.colorTextSecondary, fontSize: 44 }} />
      ) : (
        <span
          style={{
            color: token.colorTextSecondary,
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );

  return record.isDefault ? (
    <Badge.Ribbon text={defaultLabel} color={token.colorWarning} placement="end">
      {cover}
    </Badge.Ribbon>
  ) : (
    cover
  );
}

const MultiPortalsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [updatingEnabledRowKeys, setUpdatingEnabledRowKeys] = useState<MultiPortalPrimaryKey[]>([]);
  const [updatingDefaultRowKey, setUpdatingDefaultRowKey] = useState<MultiPortalPrimaryKey>();
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
    return Array.isArray(listResp?.data) ? listResp.data : [];
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

  const openRoutesDrawer = useCallback(
    (record: MultiPortalRecord) => {
      ctx.viewer.drawer({
        width: '80%',
        closable: true,
        content: () => <PortalRoutesDrawer portal={record} />,
      });
    },
    [ctx.viewer],
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

  const handleSetDefault = useMemoizedFn(async (record: MultiPortalRecord) => {
    setUpdatingDefaultRowKey(record.uid);
    try {
      await setDefaultMultiPortal({
        resource,
        filterByTk: record.uid,
        onSubmitted: refreshPortals,
      });
      message.success(t('Default portal updated successfully'));
    } finally {
      setUpdatingDefaultRowKey(undefined);
    }
  });

  const renderPortalCard = useCallback(
    (record: MultiPortalRecord) => {
      const href = getMultiPortalRouteUrl(ctx.app, record.routePath, record.portalType);
      const isNoCode = normalizePortalType(record.portalType) === DEFAULT_PORTAL_TYPE;
      const routesDisabled = !isNoCode || !record.enabled;
      // 布局记录的 title 是库里存的名字（"Desktop layout" 这种），不走 i18n；
      // 卡片上按 layoutType 映射成「桌面端 / 移动端」，跟表单里的选项文案保持一致。
      const layoutLabel = record.uiLayout
        ? getUiLayoutOptionLabel(
            {
              layoutType: record.uiLayout.layoutType,
              title: record.uiLayout.title,
              uid: record.uiLayout.uid || record.uiLayoutUid || '',
            },
            t,
          )
        : record.uiLayoutUid;

      return (
        <Card
          key={record.uid}
          size="small"
          cover={<PortalCover record={record} defaultLabel={t('Default')} />}
          styles={{
            actions: { borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px` },
            body: { padding: token.paddingSM },
          }}
          style={{ borderRadius: token.borderRadiusLG, opacity: record.enabled ? 1 : 0.6, overflow: 'visible' }}
          actions={[
            // 卡片操作只有图标，可访问名靠 aria-label 给出：tooltip 的文字不参与无障碍命名。
            // 这一个不能用 href —— 带 href 的 antd Button 渲染成 <a>，拿不到 icon-only 的方形尺寸，
            // 会变成一条明显更宽的悬浮区域，颜色也走链接色而不是正文色，和后面四个对不齐。
            <Tooltip key="view" title={t('View')}>
              <Button
                aria-label={t('View')}
                type="text"
                size="small"
                icon={<ExportOutlined />}
                onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
              />
            </Tooltip>,
            <Tooltip key="edit" title={t('Edit')}>
              <Button
                aria-label={t('Edit')}
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openFormDrawer(record)}
              />
            </Tooltip>,
            // 禁用态不弹提示：点不动的按钮再解释一遍反而干扰。
            <Tooltip key="routes" title={routesDisabled ? '' : t('Routes')}>
              <Button
                aria-label={t('Routes')}
                type="text"
                size="small"
                icon={<ApartmentOutlined />}
                disabled={routesDisabled}
                onClick={() => openRoutesDrawer(record)}
              />
            </Tooltip>,
            <Tooltip key="default" title={t('Set as default')}>
              <Button
                aria-label={t('Set as default')}
                type="text"
                size="small"
                icon={record.isDefault ? <StarFilled style={{ color: token.colorWarning }} /> : <StarOutlined />}
                disabled={!record.enabled || record.isDefault === true}
                loading={updatingDefaultRowKey === record.uid}
                onClick={async () => {
                  await handleSetDefault(record);
                }}
              />
            </Tooltip>,
            <Tooltip key="delete" title={t('Delete')}>
              <Button
                aria-label={t('Delete')}
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.uid)}
              />
            </Tooltip>,
          ]}
        >
          <Flex align="flex-start" justify="space-between" gap={token.marginXS}>
            <div style={{ minWidth: 0 }}>
              <Typography.Text strong ellipsis style={{ display: 'block' }}>
                {record.title}
              </Typography.Text>
              <Typography.Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                ellipsis
                style={{ display: 'block', fontSize: token.fontSizeSM }}
              >
                {/* 显示真正能访问的地址（带 /v 或 /x 前缀），而不是库里存的裸 routePath——
                    后者复制出去打不开，和链接自身指向的 href 也对不上。 */}
                {href}
              </Typography.Link>
            </div>
            <Switch
              aria-label={t('Enabled')}
              checked={record.enabled}
              loading={updatingEnabledRowKeys.includes(record.uid)}
              size="small"
              onChange={async (checked) => {
                await handleToggleEnabled(record, checked);
              }}
            />
          </Flex>
          <Space size={[4, 4]} wrap style={{ marginTop: token.marginXS }}>
            <Tag>{isNoCode ? t('No-code') : t('AI')}</Tag>
            {layoutLabel ? <Tag color={getLayoutTagColor(record.uiLayout?.layoutType)}>{layoutLabel}</Tag> : null}
            {record.isDefault ? <Tag color="gold">{t('Default')}</Tag> : null}
          </Space>
        </Card>
      );
    },
    [
      ctx.app,
      handleDelete,
      handleSetDefault,
      handleToggleEnabled,
      openFormDrawer,
      openRoutesDrawer,
      t,
      token.borderRadiusLG,
      token.colorWarning,
      token.fontSizeSM,
      token.marginXS,
      token.paddingSM,
      updatingDefaultRowKey,
      updatingEnabledRowKeys,
    ],
  );

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={token.marginSM} style={{ marginBottom: token.marginMD }}>
        <Typography.Text type="secondary">
          {t('Each portal is a standalone front end with its own routes and menus.')}
        </Typography.Text>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshPortals}>
            {t('Refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormDrawer()}>
            {t('Add portal')}
          </Button>
        </Space>
      </Flex>
      <Spin spinning={loading}>
        {records.length === 0 && !loading ? (
          <Empty description={t('No portals yet')} style={{ padding: token.paddingXL }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormDrawer()}>
              {t('Add portal')}
            </Button>
          </Empty>
        ) : (
          <div style={galleryGridStyle}>
            {records.map(renderPortalCard)}
            <button
              type="button"
              onClick={() => openFormDrawer()}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: `${token.lineWidth}px dashed ${token.colorBorder}`,
                borderRadius: token.borderRadiusLG,
                color: token.colorTextDescription,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: token.marginXS,
                justifyContent: 'center',
                minHeight: PORTAL_COVER_HEIGHT + 96,
                width: '100%',
              }}
            >
              <PlusOutlined style={{ fontSize: 22 }} />
              <span>{t('Add portal')}</span>
            </button>
          </div>
        )}
      </Spin>
      {pagination ? (
        <Flex justify="flex-end" style={{ marginTop: token.marginMD }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={false}
            onChange={(page) => listRequest.run(page)}
          />
        </Flex>
      ) : null}
    </div>
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
  const watchedPortalType = Form.useWatch('portalType', form);
  const watchedEnabled = Form.useWatch('enabled', form);
  // 设备对两种类型都有意义，新建时默认给桌面端。
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
        ? {
            ...toFormDraftValues(record),
            setAsDefault: false,
          }
        : {
            ...defaultFormValues,
            portalType: NEW_PORTAL_DEFAULT_TYPE,
            uid: `portal-${randomId()}`,
            sourceStorage: DEFAULT_PORTAL_SOURCE_STORAGE,
            gitBranch: DEFAULT_PORTAL_GIT_BRANCH,
            gitPath: DEFAULT_PORTAL_GIT_PATH,
            cover: null,
          },
    [record],
  );
  const accessPathPrefix = watchedPortalType === 'ai' ? '/x/' : '/v/';
  const fixedDefaultPortal = isFixedDefaultPortal(record);
  // 门户名和类型建好之后就是身份：名字在访问路径里、类型决定 /v 还是 /x，
  // 都已经被外部链接和已配好的路由引用，改了等于换一个门户。所以只在新建时可填。
  const identityLocked = fixedDefaultPortal || !!record;

  // 从 git 地址推导出来的标题 / 名称。用户手动改过之后就不再覆盖。
  const autoFilledRef = useRef<{ portalName?: string; title?: string }>({});

  const handleValuesChange = useCallback(
    (changed: Partial<MultiPortalFormDraftValues>) => {
      if (!('gitRepo' in changed)) {
        return;
      }

      const derived = derivePortalNamingFromGitUrl(changed.gitRepo);
      if (!derived) {
        return;
      }

      const current = form.getFieldsValue(['title', 'portalName']) as Partial<MultiPortalFormDraftValues>;
      const next: Partial<MultiPortalFormDraftValues> = {};

      if (!current.title?.trim() || current.title === autoFilledRef.current.title) {
        next.title = derived.title;
      }
      if (!current.portalName?.trim() || current.portalName === autoFilledRef.current.portalName) {
        next.portalName = derived.portalName;
      }

      if (Object.keys(next).length) {
        form.setFieldsValue(next);
        autoFilledRef.current = { ...autoFilledRef.current, ...next };
      }
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    const draftValues = await form.validateFields();
    const values = completeMultiPortalFormValues(draftValues);
    setSubmitting(true);
    try {
      if (record) {
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values,
          setAsDefault: record.isDefault !== true && draftValues.enabled && draftValues.setAsDefault === true,
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
      <Form form={form} layout="vertical" initialValues={initialValues} onValuesChange={handleValuesChange}>
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
          extra={t('Used in the access path.')}
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
          <Input disabled={identityLocked} addonBefore={accessPathPrefix} />
        </Form.Item>
        <Form.Item
          name="title"
          label={t('Title')}
          rules={[{ required: true, whitespace: true, message: t('Title field is required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="portalType"
          label={t('Portal type')}
          htmlFor="multi-portal-portal-type-ai"
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          {/* 显式命名：两个单选组共用同一个 name 时会被浏览器当成同一组，互相取消选中。 */}
          <Radio.Group name="multi-portal-portal-type" disabled={identityLocked} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio
                className={describedRadioClassName}
                id="multi-portal-portal-type-ai"
                style={describedRadioStyle}
                value="ai"
              >
                <span>{t('AI portal')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Create with AI Agent and code. Users can request changes in natural language. Path: /x/<name>')}
                </div>
              </Radio>
              <Radio className={describedRadioClassName} style={describedRadioStyle} value="no-code">
                <span>{t('No-code portal')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Create with visual configuration. AI can help adjust the configuration. Path: /v/<name>')}
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
                  <Radio.Group name="multi-portal-source-storage" style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
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
                          extra={t('The title and name below are filled in from the repository name.')}
                          rules={[{ required: true, whitespace: true, message: t('The field value is required') }]}
                        >
                          <Input placeholder="git@github.com:nocobase/customer-portal.git" allowClear />
                        </Form.Item>
                        <Space size={token.marginSM} style={{ display: 'flex' }} align="start">
                          <Form.Item name="gitBranch" label={t('Git branch')} style={{ flex: 1 }}>
                            <Input placeholder={DEFAULT_PORTAL_GIT_BRANCH} />
                          </Form.Item>
                          <Form.Item
                            name="gitPath"
                            label={t('Git path')}
                            style={{ flex: 1 }}
                            extra={t('Directory inside the Git repository for this portal. Leave empty for the root.')}
                          >
                            <Input placeholder="/" />
                          </Form.Item>
                        </Space>
                      </>
                    ) : null
                  }
                </Form.Item>
              </>
            ) : null
          }
        </Form.Item>

        <Divider style={{ marginBlock: token.marginSM }} />

        {/*
          设备既决定无代码 Portal 用哪套组件，也是纯代码 Portal 的归类标签
          （应用切换器按它分组），所以两种类型都要选。
        */}
        <Form.Item
          name="uiLayoutUid"
          label={t('Device')}
          extra={t('No-code portals render with the components of this device; AI portals use it for grouping.')}
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
            // 建好之后不允许改；但记录上本来就没有值时必须能选，
            // 否则必填 + 置灰会把编辑表单彻底卡死。
            disabled={fixedDefaultPortal || !!(record?.uiLayoutUid || record?.uiLayout?.uid)}
            loading={layoutOptionsService.loading}
            options={layoutOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="cover" label={t('Cover')} extra={t('Shown on the portal card. A 16:9 image works best.')}>
          <AttachmentUpload
            accept="image/*"
            preview={{ width: 160, height: 90, fit: 'cover' }}
            uploadText={t('Upload cover')}
          />
        </Form.Item>
        <Form.Item name="icon" label={t('Icon')} extra={t('Used as the cover placeholder when no cover is uploaded.')}>
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
        {record ? (
          <Form.Item
            label={t('Default portal')}
            extra={t('Users enter this portal by default when they open the application without specifying one.')}
          >
            {record.isDefault ? (
              <Switch aria-label={t('Default portal')} checked disabled />
            ) : (
              <Form.Item name="setAsDefault" noStyle valuePropName="checked">
                <Switch aria-label={t('Default portal')} disabled={watchedEnabled === false} />
              </Form.Item>
            )}
          </Form.Item>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

export default MultiPortalsPage;
