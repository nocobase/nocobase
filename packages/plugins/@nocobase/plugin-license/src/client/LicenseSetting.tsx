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
import { useAsyncEffect } from 'ahooks';
import { useT } from './locale';
import { CopyOutlined } from '@ant-design/icons';
import { LicenseValidate } from './LicenseValidate';
import { useForm } from '@formily/react';

const copyTextToClipboard = ({
  text,
  onSuccess,
  onError,
}: {
  text: string;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess?.();
    } catch (err) {
      onError?.();
    }
    document.body.removeChild(textArea);
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      onSuccess?.();
    })
    .catch((e) => {
      console.error(e);
      onError?.();
    });
};

function InstanceId() {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const t = useT();

  const getInstanceId = async () => {
    setLoading(true);
    return api
      .request({
        url: '/license:instance-id',
        method: 'GET',
      })
      .then((res) => res?.data?.data)
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Button
      onClick={async () => {
        const id = await getInstanceId();
        copyTextToClipboard({
          text: id,
          onSuccess: () => {
            message.success(t('Copied'));
          },
          onError: () => {
            message.error(t('Failed to copy, please open ./storage/.license/instance-id and copy it'));
          },
        });
      }}
      loading={loading}
      icon={<CopyOutlined />}
      type="link"
    >
      {t('Copy')}
    </Button>
  );
}

const useSubmitProps = () => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const ctx = useFormBlockContext();
  const form = useForm();
  const t = useT();

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

const TextArea = (props) => {
  const [isExists, setIsExists] = useState(false);
  const api = useAPIClient();
  const ctx = useFormBlockContext();
  const form = useForm();
  const t = useT();
  useAsyncEffect(async () => {
    const res = await api.request({
      url: '/license:is-exists',
      method: 'GET',
    });
    if (res?.data?.data) {
      form?.setFieldState('footer', (state) => {
        state.visible = false;
      });
    }
    setIsExists(res?.data?.data);
  }, []);

  if (isExists) {
    return (
      <>
        {t('License key has been set')}&nbsp;
        <Button
          onClick={() => {
            setIsExists(false);
            form?.setFieldState('footer', (state) => {
              state.visible = true;
            });
          }}
        >
          {t('Change key')}
        </Button>
      </>
    );
  }
  return <Input.TextArea rows={4} {...props} />;
};

export default function LicenseSetting() {
  const t = useT();

  const createLabelSchema = {
    type: 'void',
    'x-decorator': 'Form',
    properties: {
      form: {
        type: 'void',
        properties: {
          label: {
            type: 'string',
            title: t('Instance ID'),
            // required: true,
            'x-component': 'InstanceId',
            'x-decorator': 'FormItem',
          },
          licenseKey: {
            type: 'string',
            title: t('License key'),
            required: true,
            'x-component': 'TextArea',
            'x-decorator': 'FormItem',
            'x-component-props': {
              placeholder: t('Enter license key'),
            },
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              submit: {
                title: '{{t("Submit")}}',
                'x-component': 'Action',
                'x-use-component-props': 'useSubmitProps',
                'x-component-props': {
                  type: 'primary',
                  style: {
                    marginBottom: 16,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return (
    <Card bordered={false}>
      <LicenseValidate />
      <SchemaComponent
        scope={{ useSubmitProps }}
        components={{ InstanceId, TextArea }}
        schema={{
          type: 'void',
          properties: {
            form: createLabelSchema,
          },
        }}
      />
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            card: {
              type: 'void',
              'x-component': 'LicenseCard',
            },
          },
        }}
      />
    </Card>
  );
}
