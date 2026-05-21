/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAppVersionHTML, useCurrentAppInfo, usePlugin } from '@nocobase/client-v2';
import { parseHTML } from '@nocobase/utils/client';
import React from 'react';
import { theme as antdTheme } from 'antd';
import { useTranslation } from 'react-i18next';

export default function PoweredByLite() {
  const { token } = antdTheme.useToken();
  const { i18n } = useTranslation();
  const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
  const appInfo = useCurrentAppInfo();
  const homePage = i18n.language === 'zh-CN' ? 'https://www.nocobase.com/cn/' : 'https://www.nocobase.com';
  const customBrand = customBrandPlugin?.options?.options?.brand;

  if (customBrand) {
    const appVersion = getAppVersionHTML(appInfo?.version);

    return (
      <div
        className="nb-brand"
        dangerouslySetInnerHTML={{
          __html: parseHTML(customBrand, { appVersion }),
        }}
      />
    );
  }

  return (
    <div style={{ color: token.colorTextDescription }}>
      Powered by{' '}
      <a href={homePage} target="_blank" rel="noreferrer" style={{ color: token.colorTextDescription }}>
        NocoBase
      </a>
    </div>
  );
}
