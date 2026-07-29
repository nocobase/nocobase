/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer } from '@nocobase/flow-engine';
import { theme as antdTheme } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSystemSettings } from '../flow/system-settings';
import { getSettingsHeaderColors } from './settingsTheme';

const brandClassName = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  flex-shrink: 0;
  min-width: 0;
`;

const logoImageClassName = css`
  height: 24px;
  width: auto;
  max-width: 140px;
  object-fit: contain;
  display: block;
`;

const titleClassName = css`
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Logo 后缀刻意不做多语言。
 *
 * 它是产品标识的一部分（`<站点名> · Settings`），跟着界面语言在「设置 / 設定 / Settings」
 * 之间来回跳会让品牌区不稳定，所以固定英文。
 */
const SETTINGS_BRAND_SUFFIX = 'Settings';

const suffixClassName = css`
  line-height: 1;
  white-space: nowrap;
  font-weight: 400;
`;

/**
 * 设置中心顶栏品牌区。
 *
 * 沿用系统设置里的站点 logo / 标题，并在其后补一个弱化的 `Settings` 副标题，
 * 用于区分「设置管理中心」和业务端。
 */
export const SettingsBrand = observer(() => {
  const { token } = antdTheme.useToken();
  const headerColors = getSettingsHeaderColors(token);
  const result = useSystemSettings();
  const { t: tCollections } = useTranslation('lm-collections');
  const title = tCollections(result?.data?.data?.title || 'NocoBase');
  const logoUrl = result?.data?.data?.logo?.url;

  if (result?.loading) {
    return <div className={brandClassName} />;
  }

  return (
    <div className={brandClassName}>
      {logoUrl ? (
        // 顶栏跟随系统主题，logo 与业务端顶栏处在同一底色下，按原样显示即可。
        <img alt={title} className={logoImageClassName} src={logoUrl} />
      ) : (
        <span className={titleClassName} style={{ color: headerColors.text, fontSize: token.fontSizeHeading4 }}>
          {title}
        </span>
      )}
      <span
        aria-hidden
        style={{
          alignSelf: 'center',
          background: headerColors.text,
          height: 16,
          opacity: 0.3,
          width: 1,
        }}
      />
      <span
        className={suffixClassName}
        style={{
          color: headerColors.text,
          fontSize: token.fontSize,
          opacity: 0.75,
        }}
      >
        {SETTINGS_BRAND_SUFFIX}
      </span>
    </div>
  );
});

SettingsBrand.displayName = 'SettingsBrand';
