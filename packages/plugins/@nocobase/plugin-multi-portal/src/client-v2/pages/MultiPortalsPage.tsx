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
  CodeOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExportOutlined,
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
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
  Dropdown,
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
  Tooltip,
  Typography,
  theme,
} from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ADMIN_UI_LAYOUT_UID,
  isDefaultLayoutMultiPortalUid,
  isMultiPortalUiLayoutUid,
  MOBILE_UI_LAYOUT_UID,
} from '../../constants';
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

const defaultFormValues: Pick<MultiPortalFormValues, 'portalType' | 'uiLayoutUid' | 'enabled'> = {
  portalType: DEFAULT_PORTAL_TYPE,
  uiLayoutUid: ADMIN_UI_LAYOUT_UID,
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

/**
 * Hover styles for the gallery cards.
 *
 * Kept in CSS rather than React state: a page holds dozens of cards, and state
 * would re-render all of them every time the pointer crosses one. `:focus-within`
 * also covers the keyboard path for free, with no focus / blur handlers.
 *
 * @param {ReturnType<typeof theme.useToken>['token']} token current theme token
 * @returns {string} stylesheet
 */
function buildPortalCardCss(token: ReturnType<typeof theme.useToken>['token']) {
  return `
.nb-portal-card {
  transition: box-shadow ${token.motionDurationMid};
}
.nb-portal-card:hover {
  box-shadow: ${token.boxShadowSecondary};
}
.nb-portal-cover {
  position: relative;
}
.nb-portal-cover-overlay {
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  border: 0;
  color: #fff;
  cursor: pointer;
  display: flex;
  inset: 0;
  justify-content: center;
  opacity: 0;
  padding: 0;
  position: absolute;
  transition: opacity ${token.motionDurationMid};
}
.nb-portal-card:hover .nb-portal-cover-overlay,
.nb-portal-cover-overlay:focus-visible {
  opacity: 1;
}
`;
}

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

  const sourceStorage = normalizePortalSourceStorage(values.sourceStorage ?? baseOptions.sourceStorage);
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
      repo: normalizeOptionalString(values.gitRepo ?? baseOptions.git?.repo) || '',
      branch: normalizeOptionalString(values.gitBranch ?? baseOptions.git?.branch) || DEFAULT_PORTAL_GIT_BRANCH,
      path: normalizeOptionalString(values.gitPath ?? baseOptions.git?.path) || DEFAULT_PORTAL_GIT_PATH,
    },
  };
}

function completeMultiPortalFormValues(values: MultiPortalFormDraftValues): MultiPortalFormValues {
  const portalName = values.portalName.trim();
  const portalNameError = getMultiPortalNameFormatError(portalName);
  if (portalNameError) {
    throw new Error(portalNameError);
  }
  // cover / sourceStorage / git* 是提交前的中间态，最终都收进 options，不能作为顶层列提交。
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

function getUiLayoutUidLabel(uid: string | null | undefined, t: ReturnType<typeof useT>) {
  if (uid === ADMIN_UI_LAYOUT_UID) {
    return t('Desktop');
  }
  if (uid === MOBILE_UI_LAYOUT_UID) {
    return t('Mobile');
  }
  return uid || '';
}

function toFormValues(record: MultiPortalRecord): MultiPortalFormValues {
  const options = normalizeMultiPortalOptions(record.options);
  return {
    title: record.title,
    uid: record.uid,
    portalType: normalizePortalType(record.portalType),
    portalName: record.portalName,
    routePath: record.routePath,
    uiLayoutUid: record.uiLayoutUid || '',
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

/** Side length of the square cover on the left of a row card */
const PORTAL_COVER_HEIGHT = 56;

const galleryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  // Wider row cards stretch into empty bars; 300 fits the title and access path.
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
 * Default cover color for a portal.
 *
 * Solid rather than gradient, dark enough to carry white text: the tile is small
 * (56px), where a gradient only smears into a muddy patch, while a solid fill with
 * white text stays clean and keeps portals easy to tell apart.
 *
 * @param {string} seed hash seed (the portal uid)
 * @param {boolean} dark whether the theme is dark
 * @returns {string} CSS color
 */
/**
 * Hues the tile can take.
 *
 * Not `hash % 360`: neighbouring degrees are indistinguishable, and in practice
 * several portals in a row came out purple. These hues sit at least 35 degrees apart.
 */
const PORTAL_COVER_HUES = [210, 145, 25, 340, 265, 190, 45, 300, 165, 120];

function getPortalCoverBackground(seed: string, dark: boolean) {
  const hue = PORTAL_COVER_HUES[hashString(seed) % PORTAL_COVER_HUES.length];
  // The same lightness reads harsher on a dark theme, so pull it back a little.
  return dark ? `hsl(${hue}, 32%, 38%)` : `hsl(${hue}, 38%, 46%)`;
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

function PortalCover(props: { record: MultiPortalRecord; href: string; openLabel: string }) {
  const { href, openLabel, record } = props;
  const { token } = theme.useToken();
  const dark = isDarkThemeColor(token.colorBgContainer);
  const background = getPortalCoverBackground(record.uid || record.portalName || '', dark);
  const initial = (record.title || record.portalName || '?').trim().charAt(0).toUpperCase();
  const coverUrl = record.options?.cover?.url;

  const artwork = coverUrl ? (
    <div
      aria-hidden
      style={{
        background: `${token.colorFillQuaternary} center / cover no-repeat url("${coverUrl}")`,
        height: '100%',
        width: '100%',
      }}
    />
  ) : (
    <div
      aria-hidden
      style={{
        alignItems: 'center',
        background,
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {record.icon ? (
        <Icon type={record.icon} style={{ color: '#fff', fontSize: 24 }} />
      ) : (
        <span
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );

  const tile = (
    <div
      className="nb-portal-cover"
      style={{
        borderRadius: token.borderRadiusLG,
        height: PORTAL_COVER_HEIGHT,
        overflow: 'hidden',
        width: PORTAL_COVER_HEIGHT,
      }}
    >
      {artwork}
      {/* The whole tile is the open control: a dark scrim with a centered icon that
          appears once the pointer enters the card. Driven by CSS :hover /
          :focus-within instead of React state - per-card state would re-render the
          page on every pointer move, and focus-within covers the keyboard path. */}
      <button
        type="button"
        aria-label={openLabel}
        className="nb-portal-cover-overlay"
        onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
      >
        <ExportOutlined style={{ fontSize: 20 }} />
      </button>
    </div>
  );

  return <div style={{ flexShrink: 0 }}>{tile}</div>;
}

function PortalTitle({ title }: { title: string }) {
  const titleRef = useRef<HTMLElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const handleTooltipOpenChange = useCallback((open: boolean) => {
    const titleElement = titleRef.current;
    setTooltipOpen(Boolean(open && titleElement && titleElement.scrollWidth > titleElement.clientWidth));
  }, []);

  return (
    <span style={{ display: 'block', minWidth: 0, position: 'relative' }}>
      <Typography.Text ref={titleRef} strong ellipsis style={{ display: 'block', minWidth: 0 }}>
        {title}
      </Typography.Text>
      <Tooltip title={title} open={tooltipOpen} onOpenChange={handleTooltipOpenChange}>
        <span data-testid="portal-title-tooltip-trigger" style={{ inset: 0, position: 'absolute' }} />
      </Tooltip>
    </span>
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
    });
    return response?.data ?? { data: [] };
  });
  const { data: listResp, loading } = listRequest;
  const records = useMemo(() => {
    return Array.isArray(listResp?.data) ? listResp.data : [];
  }, [listResp?.data]);
  // AI and no-code portals are two ways of building (source code vs visual
  // configuration) with different capabilities; mixed into one grid they can only
  // be told apart by a tag. Split into two sections, AI first. Empty ones vanish.
  const groupedRecords = useMemo(() => {
    // Reuse the locale keys the per-card tags used (AI mode / No-code mode):
    // the same thing is being named, no second vocabulary for it.
    const groups = [
      { key: 'ai', title: 'AI', records: [] as MultiPortalRecord[] },
      { key: 'no-code', title: 'No-code', records: [] as MultiPortalRecord[] },
    ];
    for (const record of records) {
      const isNoCode = normalizePortalType(record.portalType) === DEFAULT_PORTAL_TYPE;
      groups[isNoCode ? 1 : 0].records.push(record);
    }
    return groups.filter((group) => group.records.length > 0);
  }, [records]);
  const portalCardCss = useMemo(() => buildPortalCardCss(token), [token]);
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

  const openSourceManagementDrawer = useCallback(
    (record: MultiPortalRecord) => {
      ctx.viewer.drawer({
        width: token.screenSM,
        closable: true,
        content: () => <PortalSourceManagementForm record={record} onSubmitted={refreshPortals} />,
      });
    },
    [ctx.viewer, refreshPortals, token.screenSM],
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
        const values = toFormValues(record);
        delete values.uiLayoutUid;
        values.enabled = enabled;
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values,
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
      const layoutLabel = getUiLayoutUidLabel(record.uiLayoutUid, t);

      const card = (
        <Card
          className="nb-portal-card"
          size="small"
          styles={{ body: { padding: token.paddingLG } }}
          // The ribbon pokes out past the left edge, so the card must not clip itself.
          style={{ cursor: 'pointer', opacity: record.enabled ? 1 : 0.6, overflow: 'visible' }}
          // The whole card opens the portal, except for two kinds of clicks:
          // 1. dropdowns and modals rendered into portals under body - React events
          //    bubble through the component tree rather than the DOM tree, so menu
          //    clicks reach this handler; DOM containment filters them out;
          // 2. elements inside the card that carry their own action (the switch,
          //    the more button, the access path link).
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (!event.currentTarget.contains(target)) {
              return;
            }
            if (target.closest('button, a, .ant-switch')) {
              return;
            }
            window.open(href, '_blank', 'noopener,noreferrer');
          }}
        >
          <Flex align="center" gap={token.margin}>
            <PortalCover record={record} href={href} openLabel={t('View')} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* The group heading says which type this is; no-code portals also show their device in a tooltip. */}
              <Flex align="center" gap={token.marginXXS}>
                <PortalTitle title={record.title} />
                {isNoCode && layoutLabel ? (
                  <Tooltip title={layoutLabel}>
                    {record.uiLayoutUid === MOBILE_UI_LAYOUT_UID ? (
                      <MobileOutlined
                        aria-label={layoutLabel}
                        style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}
                      />
                    ) : (
                      <DesktopOutlined
                        aria-label={layoutLabel}
                        style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}
                      />
                    )}
                  </Tooltip>
                ) : null}
              </Flex>
              <Flex align="center" gap={token.marginXXS} style={{ minWidth: 0 }}>
                <Typography.Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  ellipsis
                  type="secondary"
                  style={{ fontSize: token.fontSizeSM, minWidth: 0 }}
                >
                  {/* Show the address that actually resolves (with the /v or /x prefix)
                      rather than the bare routePath from the database: copying that one
                      out leads nowhere and disagrees with the link's own href. */}
                  {href}
                </Typography.Link>
              </Flex>
            </div>
            {/* Actions pinned to the top right; the ribbon moved to the top left, so they no longer collide. */}
            <Flex align="center" gap={token.marginXS} style={{ alignSelf: 'flex-start', flexShrink: 0 }}>
              {/* The default portal cannot be disabled: doing so leaves users landing on
                  an entry they cannot open, so the switch is greyed out until the default
                  is handed to another portal. */}
              <Tooltip title={record.isDefault ? t('The default portal cannot be disabled') : ''}>
                <Switch
                  aria-label={t('Enabled')}
                  checked={record.enabled}
                  disabled={record.isDefault === true}
                  loading={updatingEnabledRowKeys.includes(record.uid) || updatingDefaultRowKey === record.uid}
                  size="small"
                  onChange={async (checked) => {
                    await handleToggleEnabled(record, checked);
                  }}
                />
              </Tooltip>
              {/* The remaining actions live under "more". Only the switch stays outside,
                  because it doubles as a status indicator: one glance shows which portals
                  are turned off. */}
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    // No open entry here: clicking the card itself opens the portal.
                    { key: 'edit', icon: <EditOutlined />, label: t('Edit') },
                    ...(isNoCode
                      ? []
                      : [{ key: 'sourceManagement', icon: <CodeOutlined />, label: t('Source management') }]),
                    // Routes only mean something for an enabled no-code portal, so the
                    // entry is omitted otherwise. A greyed-out button out in the open at
                    // least hints the feature exists; inside a menu it is just one more
                    // line to read that cannot be clicked.
                    ...(routesDisabled ? [] : [{ key: 'routes', icon: <ApartmentOutlined />, label: t('Routes') }]),
                    // Omitted when it already is the default or the portal is off: making
                    // a disabled portal the default leaves users landing on an entry they
                    // cannot open.
                    ...(record.isDefault === true || !record.enabled
                      ? []
                      : [{ key: 'default', icon: <StarOutlined />, label: t('Set as default') }]),
                    { type: 'divider' as const },
                    { key: 'delete', icon: <DeleteOutlined />, label: t('Delete') },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'edit') {
                      openFormDrawer(record);
                    } else if (key === 'sourceManagement') {
                      openSourceManagementDrawer(record);
                    } else if (key === 'routes') {
                      openRoutesDrawer(record);
                    } else if (key === 'default') {
                      handleSetDefault(record);
                    } else if (key === 'delete') {
                      handleDelete(record.uid);
                    }
                  },
                }}
              >
                <Button aria-label={t('More')} type="text" size="small" icon={<EllipsisOutlined />} />
              </Dropdown>
            </Flex>
          </Flex>
        </Card>
      );

      // The default portal gets a ribbon on the top left of the card. Hanging it on the
      // 56px tile was tried: even shrunk it covered a good part of the icon, while the
      // card is exactly the width a ribbon is designed for.
      return (
        <div key={record.uid}>
          {record.isDefault ? (
            <Badge.Ribbon text={t('Default')} color={token.colorWarning} placement="start">
              {card}
            </Badge.Ribbon>
          ) : (
            card
          )}
        </div>
      );
    },
    [
      ctx.app,
      handleDelete,
      handleSetDefault,
      handleToggleEnabled,
      openFormDrawer,
      openRoutesDrawer,
      openSourceManagementDrawer,
      t,
      token.fontSizeSM,
      token.colorTextDescription,
      token.colorWarning,
      token.margin,
      token.marginXS,
      token.marginXXS,
      token.paddingLG,
      updatingDefaultRowKey,
      updatingEnabledRowKeys,
    ],
  );

  return (
    <div>
      <style>{portalCardCss}</style>
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
          groupedRecords.map((group) => (
            <div key={group.key} style={{ marginBottom: token.marginXL }}>
              {/* 组标题：标题 + 计数 + 一条延伸到底的细线。只有一行浅灰文字的话，
                  它会和上面那句说明混成一片，看不出这里已经换了一组。 */}
              <Flex align="center" gap={token.marginXS} style={{ marginBottom: token.marginSM }}>
                <Typography.Text strong>{t(group.title)}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  {group.records.length}
                </Typography.Text>
                <div style={{ background: token.colorSplit, flex: 1, height: token.lineWidth }} />
              </Flex>
              {/* 网格里不再放虚线的新建块：右上角那个「新增门户」按钮已经是入口，
                  分了组之后虚线块还得挑跟在哪一组后面，怎么放都像是"新建这一类"。 */}
              <div style={galleryGridStyle}>{group.records.map(renderPortalCard)}</div>
            </div>
          ))
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

function PortalSourceManagementForm(props: { record: MultiPortalRecord; onSubmitted: () => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { notification } = App.useApp();
  const [form] = Form.useForm<MultiPortalFormDraftValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);
  const initialValues = useMemo<Partial<MultiPortalFormDraftValues>>(() => toFormDraftValues(record), [record]);

  const handleSubmit = useCallback(async () => {
    await form.validateFields();
    const draftValues = form.getFieldsValue(true) as MultiPortalFormDraftValues;
    const values = toFormValues(record);
    values.options = getSourceStorageOptionsFromDraft({
      ...toFormDraftValues(record),
      ...draftValues,
      portalType: 'ai',
    });
    setSubmitting(true);
    try {
      await updateMultiPortal({
        resource,
        filterByTk: record.uid,
        values,
        onSubmitted,
      });
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
      title={t('Source management')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <style>{describedRadioCss}</style>
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="sourceStorage"
          label={t('Source management')}
          extra={t('Select how the application source code is stored and managed.')}
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
                  {t('Store and manage application source code in NocoBase.')}
                </div>
              </Radio>
              <Radio className={describedRadioClassName} style={describedRadioStyle} value="git">
                <span>{t('Git')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Store and manage application source code in a Git repository.')}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, next) => prev.sourceStorage !== next.sourceStorage}>
          {({ getFieldValue }) =>
            getFieldValue('sourceStorage') === 'git' ? (
              <>
                <Form.Item
                  name="gitRepo"
                  label={t('Git repository URL')}
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
      </Form>
    </DrawerFormLayout>
  );
}

function MultiPortalForm(props: { record?: MultiPortalRecord; onSubmitted: () => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { notification } = App.useApp();
  const [form] = Form.useForm<MultiPortalFormDraftValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);
  const layoutOptions = useMemo(
    () => [
      { value: ADMIN_UI_LAYOUT_UID, label: t('Desktop') },
      { value: MOBILE_UI_LAYOUT_UID, label: t('Mobile') },
    ],
    [t],
  );
  const watchedEnabled = Form.useWatch('enabled', form);
  const initialValues = useMemo<Partial<MultiPortalFormDraftValues>>(() => {
    if (record) {
      return { ...toFormDraftValues(record), setAsDefault: false };
    }
    return {
      ...defaultFormValues,
      portalType: NEW_PORTAL_DEFAULT_TYPE,
      uid: `portal-${randomId()}`,
      sourceStorage: DEFAULT_PORTAL_SOURCE_STORAGE,
      gitBranch: DEFAULT_PORTAL_GIT_BRANCH,
      gitPath: DEFAULT_PORTAL_GIT_PATH,
      cover: null,
    };
  }, [record]);
  const watchedPortalType = Form.useWatch('portalType', form);
  const effectivePortalType = watchedPortalType ?? initialValues.portalType;
  const accessPathPrefix = effectivePortalType === 'ai' ? '/x/' : '/v/';
  const fixedDefaultPortal = isFixedDefaultPortal(record);
  // 门户名和类型建好之后就是身份：名字在访问路径里、类型决定 /v 还是 /x，
  // 都已经被外部链接和已配好的路由引用，改了等于换一个门户。所以只在新建时可填。
  const identityLocked = fixedDefaultPortal || !!record;

  const handleValuesChange = useCallback(
    (changed: Partial<MultiPortalFormDraftValues>) => {
      if (!record && changed.portalType === 'ai') {
        form.setFieldsValue({ uiLayoutUid: ADMIN_UI_LAYOUT_UID });
      }
    },
    [form, record],
  );

  const handleSubmit = useCallback(async () => {
    await form.validateFields();
    const draftValues = form.getFieldsValue(true) as MultiPortalFormDraftValues;
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
          extra={
            <>
              <div>{t('Used to generate the portal URL.')}</div>
              <div>
                {t('Example:')} {`${accessPathPrefix}<name>`}
              </div>
            </>
          }
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
          extra={t('Display name of the portal.')}
          rules={[{ required: true, whitespace: true, message: t('Title field is required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="portalType"
          label={t('Development mode')}
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
                <span>{t('AI mode')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Build complete business systems with AI agents and code.')}
                </div>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t(
                    'Users describe requirements in natural language, and AI agents create and modify applications, including interfaces, data models, business logic, roles and permissions, and more.',
                  )}
                </div>
              </Radio>
              <Radio className={describedRadioClassName} style={describedRadioStyle} value="no-code">
                <span>{t('No-code mode')}</span>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t('Build business systems through visual configuration.')}
                </div>
                <div style={{ color: token.colorTextDescription, fontSize: token.fontSizeSM }}>
                  {t(
                    'Users create applications through drag-and-drop configuration. AI can assist with creating, adjusting, and optimizing configurations such as data models, interfaces, workflows, and more.',
                  )}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Divider style={{ marginBlock: token.marginSM }} />

        {/* AI Portal 不暴露设备选择；新建时固定为 Desktop，编辑时保留记录中的值。 */}
        <Form.Item
          name="uiLayoutUid"
          label={t('Device')}
          extra={t('No-code portals render with the components of this device; AI portals use it for grouping.')}
          hidden={effectivePortalType === 'ai'}
          dependencies={['portalType']}
          rules={[
            {
              validator: (_, value?: string | null) => {
                if (!isMultiPortalUiLayoutUid(value)) {
                  return Promise.reject(new Error(t('The field value is required')));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            // 设备类型创建后保持不变；新建时只能从两个固定 UID 中选择。
            disabled={Boolean(record)}
            options={layoutOptions}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="cover" label={t('Cover')} extra={t('Shown on the portal card.')}>
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
