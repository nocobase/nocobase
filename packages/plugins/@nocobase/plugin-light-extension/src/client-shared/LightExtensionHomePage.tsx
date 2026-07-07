/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../constants';
import { LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';

type ModernClientWindow = Window & {
  __nocobase_modern_client_prefix__?: string;
  __nocobase_public_path__?: string;
};

function useT() {
  return useTranslation(NAMESPACE).t;
}

const LightExtensionHomePage: React.FC = () => {
  const t = useT();

  return (
    <Flex vertical gap={24} style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {t('Light extensions')}
      </Typography.Title>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No light extensions yet')} style={{ marginTop: 48 }}>
        <Button
          aria-label={t('Create light extension')}
          href={getModernLightExtensionSettingsHref({ create: true })}
          type="primary"
          icon={<PlusOutlined />}
        >
          {t('Create light extension')}
        </Button>
      </Empty>
    </Flex>
  );
};

function getModernLightExtensionSettingsHref(options: { create?: boolean } = {}): string {
  const basePath = getModernClientBasePath();
  const path = joinRootRelativePath(basePath, `/admin/settings/${LIGHT_EXTENSION_SETTINGS_KEY}`);
  return options.create ? `${path}?create=1` : path;
}

function getModernClientBasePath(): string {
  if (typeof window === 'undefined') {
    return '/v/';
  }

  const win = window as ModernClientWindow;
  const prefix = normalizeSegment(win.__nocobase_modern_client_prefix__) || 'v';
  const publicPath = normalizeBasePath(win.__nocobase_public_path__);

  if (!publicPath || publicPath === '/') {
    return `/${prefix}/`;
  }

  const trimmedPublicPath = trimTrailingSlashes(publicPath);
  if (trimmedPublicPath.endsWith(`/${prefix}`)) {
    return ensureTrailingSlash(trimmedPublicPath);
  }

  return ensureTrailingSlash(`${trimmedPublicPath}/${prefix}`);
}

function normalizeSegment(value?: string): string {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

function normalizeBasePath(value?: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return '';
  }
  return ensureTrailingSlash(`/${normalized.replace(/^\/+|\/+$/g, '')}`);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/g, '') || '/';
}

function joinRootRelativePath(basePath: string, path: string): string {
  const normalizedBasePath = ensureTrailingSlash(basePath || '/');
  const normalizedPath = `/${String(path || '').replace(/^\/+/, '')}`;

  if (normalizedBasePath === '/') {
    return normalizedPath;
  }

  return `/${`${normalizedBasePath}${normalizedPath}`.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/')}`;
}

export default LightExtensionHomePage;
