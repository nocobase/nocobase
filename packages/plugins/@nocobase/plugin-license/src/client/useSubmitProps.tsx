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
import { Card, Typography, Spin, message, Input, Button, Alert, Modal } from 'antd';
import { useT } from './locale';
import { useForm } from '@formily/react';
import { LicenseSettingContext } from './LicenseSettingContext';

export const useSubmitProps = () => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const form = useForm();
  const t = useT();
  const { onSaveSuccess } = React.useContext(LicenseSettingContext);

  const saveLicenseKey = async (licenseKey: string) => {
    setLoading(true);
    try {
      const res: any = await api.request({
        url: '/license:license-key',
        method: 'POST',
        data: {
          licenseKey,
        },
      });
      setLoading(false);

      const licenseValidateResult: any = res?.data?.data || {};

      // save error
      if (licenseValidateResult.keyStatus === 'invalid') {
        Modal.error({
          title: t('Invalid license key.'),
          content: t('The license key is invalid. Please visit the NocoBase Service to obtain a new license key.'),
        });
        return;
      }
      if (licenseValidateResult.licenseStatus === 'invalid') {
        Modal.error({
          title: t('Invalid license key.'),
          content: t(
            'The current license key has been deprecated. Please visit the NocoBase Service to obtain a new license key.',
          ),
        });
        return;
      }

      if (licenseValidateResult.envMatch === false) {
        Modal.error({
          title: t('Environment mismatch.'),
          content: (
            <>
              {licenseValidateResult.dbMatch === false && licenseValidateResult.sysMatch === false && (
                <>
                  {t(
                    'The current system and database do not match the licensed environment. Please use the new InstanceID to request a new license key.',
                  )}
                </>
              )}
              {licenseValidateResult.dbMatch === true && licenseValidateResult.sysMatch === false && (
                <>
                  {t(
                    'The current system does not match the licensed system. Please use the new InstanceID to request a new license key.',
                  )}
                </>
              )}
              {licenseValidateResult.dbMatch === false && licenseValidateResult.sysMatch === true && (
                <>
                  {t(
                    'The current database does not match the licensed database. Please use the new InstanceID to request a new license key.',
                  )}
                </>
              )}
            </>
          ),
        });
        return;
      }

      if (licenseValidateResult.domainMatch === false) {
        Modal.error({
          title: t('Domain mismatch.'),
          content: t(
            'The current domain ({{domain}}) does not match the licensed domain. Please use the current domain to request a new license key.',
            {
              domain: licenseValidateResult.current.domain,
              interpolation: { escapeValue: false },
            },
          ),
        });
        return;
      }

      // save key succes
      onSaveSuccess?.();

      if (licenseValidateResult.isExpired === true) {
        message.success(t('The license key was saved successfully'), 5);
        Modal.warning({
          title: t('The license has exceeded the upgrade validity period.'),
          content: t(
            'Plugins bound to this license can still be used but cannot be upgraded. To upgrade, please renew or repurchase the license.',
          ),
        });
        return;
      }

      if (licenseValidateResult.isPkgLogin === false) {
        message.success(t('The license key was saved successfully'), 5);
        Modal.warning({
          title: t('Network error.'),
          content: t(
            'Due to network issues, plugins cannot be updated automatically (they are still usable). To update plugins, please check your network connection or refer to the NocoBase Service documentation to upload plugins manually.',
          ),
        });
        return;
      }

      message.success(t('License key saved successfully. Please retry the plugin installation.'));
    } catch (e) {
      setLoading(false);
      message.error(t('Network error. Please try again.'));
    }
  };

  return {
    loading,
    onClick: async () => {
      await form?.validate();
      const licenseKey = form.values?.licenseKey;
      await saveLicenseKey(licenseKey);
    },
  };
};
