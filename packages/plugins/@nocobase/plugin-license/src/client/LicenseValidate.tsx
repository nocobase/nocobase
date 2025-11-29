/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { SchemaComponent, useAPIClient, useFormBlockContext } from '@nocobase/client';
import { Card, Typography, Spin, message, Input, Button, Alert } from 'antd';
import { useAsyncEffect } from 'ahooks';
import { useT } from './locale';
import { CopyOutlined } from '@ant-design/icons';
import { Env } from '@nocobase/license-kit';
import { useTranslation } from 'react-i18next';

export const LicenseValidate = () => {
  const api = useAPIClient();
  const [state, setState] = useState<{
    keyNotExists: boolean;
    envMatch: boolean;
    domainMatch: boolean;
    current: {
      domain: string;
      env: Env;
    };
    isPkgConnection: boolean;
    isPkgLogin: boolean;
  }>(null);

  const { i18n } = useTranslation();
  const t = useT();

  useEffect(() => {
    api
      .request({
        url: '/license:license-validate',
        method: 'get',
      })
      .then((res) => {
        setState(res?.data?.data);
      })
      .catch((err) => {
        console.log(err);
      });
    // message.error('授权key格式异常，请前往NocoBase Service重新获取授权key', 10);
    // message.error('授权key与当前环境不匹配，请前往NocoBase Service重新获取授权key', 10);
    // message.error('授权key与当前域名不匹配，请前往NocoBase Service重新获取授权key', 10);
    // message.warning('授权Key保存成功，当前环境无法连接NocoBase Service，仅支持手动安装商业插件', 10);
    // message.success('授权key保存成功，如需安装商业插件，请重启NocoBase服务', 10);
  }, []);

  console.log('state', state);
  if (state?.envMatch === false) {
    return (
      <Alert
        message={t('Environment mismatch')}
        description={
          <>
            {t('The current environment does not match the licensed environment.')}
            <br />
            {t('Current environment')}
            <ul style={{ margin: 0 }}>
              <li>
                {t('System')}: <strong>{state?.current?.env?.sys}</strong>
              </li>
              <li>
                {t('Database')}:{' '}
                <strong>
                  {state?.current?.env?.db?.type} ({state?.current?.env?.db?.name})
                </strong>
              </li>
            </ul>
            {t('You can view common causes and solutions: ')}
            {i18n.language === 'zh-CN' ? (
              <a href="https://service-cn.nocobase.com/admin/rr0evd4ursl" target="_blank" rel="noreferrer">
                https://service-cn.nocobase.com/admin/rr0evd4ursl
              </a>
            ) : (
              <a href="https://service-en.nocobase.com/admin/pbox06h0o90" target="_blank" rel="noreferrer">
                https://service-en.nocobase.com/admin/pbox06h0o90
              </a>
            )}
          </>
        }
        type="error"
      />
    );
  }

  if (state?.domainMatch === false) {
    return (
      <Alert
        message={t('Domain mismatch')}
        description={
          <>
            {t('The current domain does not match the licensed domain.')}
            <br />
            {t('Current domain')}: <strong>{state?.current?.domain}</strong>
            <br />
            {t('You can view common causes and solutions: ')}
            {i18n.language === 'zh-CN' ? (
              <a href="https://service-cn.nocobase.com/admin/rr0evd4ursl" target="_blank" rel="noreferrer">
                https://service-cn.nocobase.com/admin/rr0evd4ursl
              </a>
            ) : (
              <a href="https://service-en.nocobase.com/admin/pbox06h0o90" target="_blank" rel="noreferrer">
                https://service-en.nocobase.com/admin/pbox06h0o90
              </a>
            )}
          </>
        }
        type="error"
      />
    );
  }

  if (state?.isPkgConnection === false) {
    return (
      <Alert
        message={t('Network exception')}
        description={
          <>
            {t(
              'The current environment cannot connect to NocoBase Service, only manual installation of commercial plugins is supported.',
            )}
            <br />
            {t('You can view operation guidelines: ')}
            <a href="https://docs-en.nocobase.com/welcome/getting-started/plugin" target="_blank" rel="noreferrer">
              https://docs-en.nocobase.com/welcome/getting-started/plugin
            </a>
          </>
        }
        type="warning"
      />
    );
  }

  if (state?.isPkgLogin === false) {
    return (
      <Alert
        message={t('Network exception')}
        description={
          <>
            {t(
              'The current environment cannot log in to NocoBase Service, only manual installation of commercial plugins is supported.',
            )}
            <br />
            {t('You can view operation guidelines: ')}
            <a href="https://docs-cn.nocobase.com/welcome/getting-started/plugin" target="_blank" rel="noreferrer">
              https://docs-cn.nocobase.com/welcome/getting-started/plugin
            </a>
          </>
        }
        type="warning"
      />
    );
  }
  return null;
};
