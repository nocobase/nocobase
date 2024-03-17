import { css } from '@emotion/css';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useToken } from '../style';
import { usePlugin } from '../application';

export const PoweredBy = () => {
  const { i18n } = useTranslation();
  const { token } = useToken();
  const customBrandPlugin: any = usePlugin('@nocobase/plugin-custom-brand');
  const urls = {
    'en-US': 'https://www.nocobase.com',
    'zh-CN': 'https://cn.nocobase.com',
  };

  return (
    <div
      className={css`
        text-align: center;
        color: ${token.colorTextDescription};
        a {
          color: ${token.colorTextDescription};
          &:hover {
            color: ${token.colorText};
          }
        }
      `}
      dangerouslySetInnerHTML={{
        __html:
          customBrandPlugin?.options?.options?.brand ||
          `Powered by <a href="${urls[i18n.language] || urls['en-US']}">NocoBase</a>`,
      }}
    ></div>
  );
};
