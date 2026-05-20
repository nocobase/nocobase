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
import { useFlowEngine } from '@nocobase/flow-engine';
import { theme } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlugin } from '../hooks/usePlugin';

const homePageUrls: Record<string, string> = {
  'en-US': 'https://www.nocobase.com',
  'zh-CN': 'https://www.nocobase.com/cn/',
};

function useAppVersion() {
  const flowEngine = useFlowEngine();
  const [version, setVersion] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    Promise.resolve(flowEngine.context.appInfo)
      .then((info: any) => {
        if (active) setVersion(info?.version);
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [flowEngine]);

  return version;
}

export function PoweredBy() {
  const { i18n } = useTranslation();
  const { token } = theme.useToken();
  const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
  const version = useAppVersion();
  const appVersion = version ? `<span class="nb-app-version">v${version}</span>` : '';
  const homePage = homePageUrls[i18n.language] || homePageUrls['en-US'];
  const brandStyle = css`
    text-align: center;
    color: ${token.colorTextDescription};
    a {
      color: ${token.colorTextDescription};
      &:hover {
        color: ${token.colorText};
      }
    }
  `;

  return (
    <div
      className={cx(brandStyle, 'nb-brand')}
      dangerouslySetInnerHTML={{
        __html: parseHTML(
          customBrandPlugin?.options?.options?.brand ||
            `Powered by <a href="${homePage}" target="_blank" rel="noreferrer">NocoBase</a>`,
          { appVersion },
        ),
      }}
    />
  );
}

export default PoweredBy;
