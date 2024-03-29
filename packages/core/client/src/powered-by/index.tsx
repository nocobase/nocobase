import { css, cx } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToken } from '../style';
import { usePlugin } from '../application';
import { parseHTML } from '@nocobase/utils/client';
import { useCurrentAppInfo } from '../appInfo/CurrentAppInfoProvider';

export const PoweredBy = () => {
  const { i18n } = useTranslation();
  const { token } = useToken();
  const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
  const data = useCurrentAppInfo();
  const urls = {
    'en-US': 'https://www.nocobase.com',
    'zh-CN': 'https://cn.nocobase.com',
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

  return (
    <div
      className={cx(style, 'nb-brand')}
      dangerouslySetInnerHTML={{
        __html: parseHTML(
          customBrandPlugin?.options?.options?.brand ||
            `Powered by <a href="${urls[i18n.language] || urls['en-US']}" target="__blank">NocoBase</a>`,
          { appVersion },
        ),
      }}
    ></div>
  );
};
