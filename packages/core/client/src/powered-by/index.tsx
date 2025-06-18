/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { parseHTML } from '@nocobase/utils/client';
import { sanitizeHTMLString } from '../common';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';
import { usePlugin } from '../application';
import { useToken } from '../style';

export const PoweredBy = () => {
  const { i18n } = useTranslation();
  const { token } = useToken();
  const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
  const data = useCurrentAppInfo();
  const urls = {
    'en-US': 'https://www.nocobase.com',
    'zh-CN': 'https://www.nocobase.com/cn/',
  };
  const style = css`
    text-align: center;
    color: ${token.colorTextDescription};
    a {
      color: ${token.colorTextDescription};
      &:hover {
        color: ${token.colorText};
      }
    }
  `;
  const appVersion = `<span class="nb-app-version">v${data?.data?.version}</span>`;

  const html = parseHTML(
    customBrandPlugin?.options?.options?.brand ||
      `Powered by <a href="${urls[i18n.language] || urls['en-US']}" target="_blank">NocoBase</a>`,
    { appVersion },
  );

  return (
    <div
      className={cx(style, 'nb-brand')}
      dangerouslySetInnerHTML={{ __html: sanitizeHTMLString(html) }}
    ></div>
  );
};
