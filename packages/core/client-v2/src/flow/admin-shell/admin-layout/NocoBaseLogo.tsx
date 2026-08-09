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
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSystemSettings } from '../../system-settings';
import type { CustomToken } from '../../../theme';

const logoContainerClassName = css`
  height: var(--nb-header-height);
  margin-right: 4px;
  display: inline-flex;
  flex-shrink: 0;
  padding: 0;
  align-items: center;
`;

const fixedWidthClassName = css`
  ${logoContainerClassName}
  width: 168px;
`;

const autoWidthClassName = css`
  ${logoContainerClassName}
  width: auto;
  min-width: 168px;
`;

const logoImageClassName = css`
  object-fit: contain;
  width: 100%;
  height: 100%;
`;

const titleClassName = css`
  width: 100%;
  height: 100%;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NocoBaseLogo = observer(() => {
  const { token } = antdTheme.useToken();
  const customToken = token as CustomToken;
  const result = useSystemSettings();
  const { t } = useTranslation('lm-collections');
  const title = t(result?.data?.data?.title || 'NocoBase');
  const logoUrl = result?.data?.data?.logo?.url;
  const titleStyle = useMemo<React.CSSProperties>(
    () => ({ color: customToken.colorTextHeaderMenu, fontSize: customToken.fontSizeHeading3 }),
    [customToken.colorTextHeaderMenu, customToken.fontSizeHeading3],
  );

  const logo = logoUrl ? (
    <img alt={title} className={logoImageClassName} src={logoUrl} />
  ) : (
    <span style={titleStyle} className={titleClassName}>
      {title}
    </span>
  );

  return <div className={logoUrl ? fixedWidthClassName : autoWidthClassName}>{result?.loading ? null : logo}</div>;
});

NocoBaseLogo.displayName = 'NocoBaseLogo';
