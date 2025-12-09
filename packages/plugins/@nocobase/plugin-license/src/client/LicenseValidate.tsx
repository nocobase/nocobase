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
    isServiceConnection: boolean;
    pkgUrl: string;
    isExpired: boolean;
    licenseStatus?: string;
    keyData?: {
      service?: {
        docsUrl?: string;
      };
    };
    pluginsLicensed: boolean;
    keyStatus: string;
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

  if (state?.keyStatus === 'invalid') {
    return (
      <Alert
        message={t('The license key is invalid')}
        type="error"
        description={
          <>{t('Please check your license key format or generate a new license key from NocoBase Service.')}</>
        }
      />
    );
  }

  if (state?.licenseStatus && state?.licenseStatus !== 'active') {
    return (
      <Alert
        message={t('The license key is invalid')}
        type="error"
        description={<>{t('Please check your license key, or generate a new one from NocoBase Service.')}</>}
      />
    );
  }

  if (state?.isExpired) {
    return (
      <Alert
        message={t('The license upgrade period has expired')}
        type="error"
        description={
          <>
            {t(
              'You may continue using the related plugins, but updates are no longer available. Please renew or repurchase your license to restore update services.',
            )}
          </>
        }
      />
    );
  }

  if (state?.envMatch === false) {
    return (
      <Alert
        message={t('Environment mismatch')}
        description={
          <>
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
            {t(
              'The current environment does not match the licensed environment. Please use the updated InstanceID to obtain a new license key.',
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
            {t(
              'The licensed domain does not match the current domain {{domain}}. Please go to NocoBase Service to obtain a new license key.',
              {
                domain: state?.current?.domain,
                interpolation: { escapeValue: false },
              },
            )}
          </>
        }
        type="error"
      />
    );
  }

  if (state?.pluginsLicensed === false) {
    return (
      <Alert
        message={t('The plugin is not licensed')}
        description={
          <>
            {t(
              'We detected that you are using an unlicensed plugin. Please visit NocoBase Service to purchase or activate your license.',
            )}
          </>
        }
        type="error"
      />
    );
  }

  if (state?.isServiceConnection === false && state?.isPkgLogin === false) {
    return (
      <Alert
        message={t('Network exception')}
        description={
          <>
            {t(
              'Due to network issues, the license key cannot be updated automatically. Please update it manually if needed.',
            )}
            <br />
            {t(
              'The plugin cannot be updated automatically (it remains functional). To update the plugin, please check your network connection or refer to the NocoBase Service documentation to upload the plugin manually.',
            )}
          </>
        }
        type="warning"
      />
    );
  }

  if (state?.isServiceConnection === false) {
    return (
      <Alert
        message={t('Network exception')}
        description={
          <>
            {t(
              'Due to network issues, the license key cannot be updated automatically. Please update it manually if needed.',
            )}
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
              'Due to network issues, the plugin cannot be updated automatically (it remains functional). If you need to update the plugin, please check your network connection or follow the NocoBase Service documentation to upload it manually.',
            )}
          </>
        }
        type="warning"
      />
    );
  }

  return null;
};
