/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Icon, BlockModel } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { Alert, Avatar, Empty, theme, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type { CSSProperties } from 'react';
import React, { useMemo } from 'react';
import { tExpr } from '../locale';
import { getMultiPortalRouteUrl, type MultiPortalAppLike } from '../routeUrl';

type MultiPortalAccessibleRecord = {
  uid: string;
  title?: string | null;
  icon?: string | null;
  portalType?: string | null;
  routeName?: string;
  routePath: string;
  authCheck?: boolean;
  enabled?: boolean;
  uiLayout?: {
    layoutType?: string;
  };
};

type MultiPortalAccessibleListBody = {
  data?: MultiPortalAccessibleRecord[];
};

type MultiPortalBlockApp = MultiPortalAppLike & {
  apiClient?: {
    request: <TBody>(params: { url: string; method: 'get'; skipNotify?: boolean }) => Promise<{ data?: TBody }>;
  };
};

type ThemeToken = ReturnType<typeof theme.useToken>['token'];

const { Text } = Typography;

function getPortalCardMetrics(token: ThemeToken) {
  const avatarSize = token.controlHeightLG + token.paddingSM + token.paddingXXS;
  const paddingBlock = token.paddingLG - token.paddingXXS;

  return {
    avatarSize,
    cardHeight: avatarSize + paddingBlock * 2,
    gridMinColumnWidth: token.controlHeightLG * 9,
    iconSize: token.fontSizeHeading3 + token.marginXXS,
    paddingBlock,
  };
}

const useStyles = createStyles(({ token }) => ({
  portalItem: {
    '&:hover': {
      background: token.colorBgTextHover,
      borderColor: token.colorBorder,
      boxShadow: token.boxShadowTertiary,
      color: token.colorText,
      transform: `translateY(-${token.lineWidth}px)`,
    },
    '&:focus-visible': {
      outline: `${token.controlOutlineWidth}px solid ${token.colorPrimaryBorder}`,
      outlineOffset: token.controlOutlineWidth,
    },
    '.ant-typography': {
      color: 'inherit',
    },
  },
}));

function getPortalTitle(record: MultiPortalAccessibleRecord) {
  const title = record.title?.trim();
  return title || record.uid;
}

function getAvatarText(record: MultiPortalAccessibleRecord) {
  return (getPortalTitle(record).trim()[0] || 'P').toUpperCase();
}

function getStableIndex(value: string, length: number) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2147483647;
  }
  return Math.abs(hash) % length;
}

function getFallbackAvatarPalette(token: ThemeToken, record: MultiPortalAccessibleRecord) {
  const palettes = [
    { background: token.colorPrimaryBg, color: token.colorPrimary },
    { background: token.colorSuccessBg, color: token.colorSuccess },
    { background: token.colorWarningBg, color: token.colorWarning },
    { background: token.colorErrorBg, color: token.colorError },
    { background: token.colorInfoBg, color: token.colorInfo },
  ];
  return palettes[getStableIndex(`${record.uid}:${record.title || ''}`, palettes.length)];
}

function PortalAvatar(props: { record: MultiPortalAccessibleRecord; token: ThemeToken }) {
  const { record, token } = props;
  const metrics = getPortalCardMetrics(token);
  const icon = record.icon?.trim();
  const frameStyle: CSSProperties = {
    alignItems: 'center',
    background: token.colorFillTertiary,
    borderRadius: token.borderRadiusLG,
    color: token.colorText,
    display: 'flex',
    flex: `0 0 ${metrics.avatarSize}px`,
    fontSize: token.fontSizeHeading3,
    height: metrics.avatarSize,
    justifyContent: 'center',
    lineHeight: 1,
    width: metrics.avatarSize,
  };

  if (icon) {
    return (
      <Avatar shape="square" size={metrics.avatarSize} style={frameStyle} icon={null}>
        <Icon type={icon} aria-hidden style={{ color: token.colorPrimary, fontSize: metrics.iconSize }} />
      </Avatar>
    );
  }

  const palette = getFallbackAvatarPalette(token, record);
  return (
    <Avatar
      aria-hidden
      shape="square"
      size={metrics.avatarSize}
      style={{
        ...frameStyle,
        background: palette.background,
        color: palette.color,
        fontWeight: token.fontWeightStrong,
      }}
    >
      {getAvatarText(record)}
    </Avatar>
  );
}

function MultiPortalBlockContent(props: { model: MultiPortalBlockModel }) {
  const { model } = props;
  const { token } = theme.useToken();
  const { styles } = useStyles();
  const metrics = useMemo(() => getPortalCardMetrics(token), [token]);
  const app = model.context.app as MultiPortalBlockApp | undefined;
  const t = model.translate;
  const { data, error, loading } = useRequest(async () => {
    const response = await app?.apiClient?.request<MultiPortalAccessibleListBody>({
      url: 'multiPortals:listAccessible',
      method: 'get',
      skipNotify: true,
    });
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  });
  const records = data ?? [];
  const gridStyle = useMemo<CSSProperties>(
    () => ({
      display: 'grid',
      gap: token.marginSM,
      gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${metrics.gridMinColumnWidth}px), 1fr))`,
    }),
    [metrics.gridMinColumnWidth, token.marginSM],
  );
  const portalItemStyle = useMemo<CSSProperties>(
    () => ({
      alignItems: 'center',
      background: token.colorBgContainer,
      border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      boxSizing: 'border-box',
      color: token.colorText,
      display: 'flex',
      gap: token.marginSM,
      height: metrics.cardHeight,
      padding: `${metrics.paddingBlock}px ${token.paddingLG}px`,
      textDecoration: 'none',
      transition: `background ${token.motionDurationMid}, border-color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}, transform ${token.motionDurationMid}`,
    }),
    [
      metrics.cardHeight,
      metrics.paddingBlock,
      token.borderRadiusLG,
      token.colorBgContainer,
      token.colorBorderSecondary,
      token.colorText,
      token.lineWidth,
      token.marginSM,
      token.motionDurationMid,
      token.paddingLG,
    ],
  );

  if (error) {
    return <Alert type="warning" message={t('Failed to load portals')} showIcon />;
  }

  if (loading) {
    return <div style={{ minHeight: metrics.cardHeight }} />;
  }

  if (records.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No portals')} />;
  }

  return (
    <div data-testid="multi-portal-block-grid" style={gridStyle}>
      {records.map((record) => {
        const title = getPortalTitle(record);
        return (
          <a
            key={record.uid}
            href={getMultiPortalRouteUrl(app, record.routePath, record.portalType)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="multi-portal-block-card"
            className={styles.portalItem}
            style={portalItemStyle}
          >
            <PortalAvatar record={record} token={token} />
            <Text
              strong
              ellipsis
              style={{
                flex: 1,
                fontSize: token.fontSizeLG,
                lineHeight: token.lineHeightLG,
                marginBottom: 0,
                minWidth: 0,
              }}
              title={title}
            >
              {title}
            </Text>
          </a>
        );
      })}
    </div>
  );
}

export class MultiPortalBlockModel extends BlockModel {
  renderComponent() {
    return <MultiPortalBlockContent model={this} />;
  }
}

MultiPortalBlockModel.define({
  label: tExpr('Portals'),
  hide: true,
  createModelOptions: {
    use: 'MultiPortalBlockModel',
    stepParams: {
      cardSettings: {
        titleDescription: {
          title: tExpr('Portals'),
        },
      },
    },
  },
  sort: 600,
});
