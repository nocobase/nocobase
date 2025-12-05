/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { useAPIClient } from '@nocobase/client';
import { Alert } from 'antd';
import { useT } from './locale';
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
    pkgUrl: string;
    isExpired: boolean;
    licenseStatus?: string;
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
  }, []);

  const helps = (
    <>
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
  );

  if (state?.licenseStatus && state?.licenseStatus !== 'active') {
    return <Alert message={t('The license key is invalid')} type="error" description={helps} />;
  }

  if (state?.isExpired) {
    return <Alert message={t('The license key has expired')} type="error" description={helps} />;
  }

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
                {t('System')}:{' '}
                <strong>
                  {state?.current?.env?.sys} {state?.current?.env?.osVer}
                </strong>
              </li>
              <li>
                {t('Database')}:{' '}
                <strong>
                  {state?.current?.env?.db?.type} ({state?.current?.env?.db?.name})
                </strong>
              </li>
            </ul>
            {helps}
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
            {helps}
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
              'The current key cannot log in to NocoBase Service, only manual installation of commercial plugins is supported.',
            )}
            <br />
            NocoBase pkg url: {state?.pkgUrl}
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
