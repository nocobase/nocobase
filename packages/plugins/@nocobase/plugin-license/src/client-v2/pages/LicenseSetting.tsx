/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { Alert, App, Button, Card, Form, Input, Spin } from 'antd';
import type { ComponentType } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';

type LicenseValidateResult = {
  keyExist?: boolean;
  keyStatus?: string;
  licenseStatus?: 'active' | 'invalid';
  isPkgLogin?: boolean;
  isServiceConnection?: boolean;
  isExpired?: boolean;
  envMatch?: boolean;
  dbMatch?: boolean;
  sysMatch?: boolean;
  domainMatch?: boolean;
  current?: {
    domain?: string;
  };
};

type LicenseFormValues = {
  licenseKey?: string;
};

type ApiResponse<T> = {
  data?: {
    data?: T;
  };
};

type LicenseCardComponentProps = {
  key?: React.Key;
};

const copyTextToClipboard = async (text: string) => {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Some browsers reject Clipboard API calls after an awaited request.
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

function LicenseStatusPanel({ refreshToken }: { refreshToken: number }) {
  const t = useT();
  const { api } = useFlowContext();
  const [state, setState] = useState<LicenseValidateResult | null>(null);

  useEffect(() => {
    let mounted = true;
    setState(null);
    api
      .request({
        url: '/license:license-validate',
        method: 'get',
      })
      .then((res) => {
        if (mounted) {
          setState(res?.data?.data || null);
        }
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      mounted = false;
    };
  }, [api, refreshToken]);

  const warning = useMemo(() => {
    if (!state?.licenseStatus || state.licenseStatus !== 'active') {
      return null;
    }

    if (state.isServiceConnection === false && state.isPkgLogin === false) {
      return (
        <Alert
          message={t('Network error.')}
          description={
            <>
              {t(
                'Due to network issues, the license key cannot be updated automatically. Please update it manually if necessary.',
              )}
              <br />
              {t(
                'Plugins also cannot be updated automatically (they are still usable). To update plugins, please check your network connection or refer to the NocoBase Service documentation to upload plugins manually.',
              )}
            </>
          }
          type="warning"
          style={{
            marginBottom: 12,
          }}
        />
      );
    }

    if (state.isServiceConnection === false) {
      return (
        <Alert
          message={t('Network error.')}
          description={t(
            'Due to network issues, the license key cannot be updated automatically. Please update it manually if necessary.',
          )}
          type="warning"
          style={{
            marginBottom: 12,
          }}
        />
      );
    }

    if (state.isPkgLogin === false) {
      return (
        <Alert
          message={t('Network error.')}
          description={t(
            'Due to network issues, plugins cannot be updated automatically (they are still usable). To update plugins, please check your network connection or refer to the NocoBase Service documentation to upload plugins manually.',
          )}
          type="warning"
          style={{
            marginBottom: 12,
          }}
        />
      );
    }

    return null;
  }, [state, t]);

  return warning;
}

export default function LicenseSetting() {
  const t = useT();
  const { api, app } = useFlowContext();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<LicenseFormValues>();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [keyExist, setKeyExist] = useState<boolean | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [instanceId, setInstanceId] = useState('');
  const [copyingInstanceId, setCopyingInstanceId] = useState(false);

  useEffect(() => {
    let mounted = true;
    setChecking(true);
    const checkLicenseKey = async () => {
      try {
        const res = await api.request({
          url: '/license:is-exists',
          method: 'GET',
        });
        if (!mounted) {
          return;
        }
        const exists = Boolean(res?.data?.data);
        setKeyExist(exists);
        setIsEdit(!exists);
      } catch (err) {
        console.log(err);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkLicenseKey();

    return () => {
      mounted = false;
    };
  }, [api]);

  useEffect(() => {
    let mounted = true;
    api
      .request({
        url: '/license:instance-id',
        method: 'GET',
      })
      .then((res) => {
        if (mounted) {
          setInstanceId(String(res?.data?.data || ''));
        }
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      mounted = false;
    };
  }, [api]);

  const handleCopyInstanceId = useCallback(async () => {
    setCopyingInstanceId(true);
    try {
      let text = instanceId;
      if (!text) {
        const res = await api.request({
          url: '/license:instance-id',
          method: 'GET',
        });
        text = String(res?.data?.data || '');
        setInstanceId(text);
      }
      const copied = await copyTextToClipboard(text);
      if (copied) {
        message.success(t('Copied'));
        return;
      }
      message.error(t('Failed to copy, please open ./storage/.license/instance-id and copy it'));
    } catch (err) {
      message.error(t('Failed to copy, please open ./storage/.license/instance-id and copy it'));
    } finally {
      setCopyingInstanceId(false);
    }
  }, [api, instanceId, message, t]);

  const saveLicenseKey = useCallback(
    async (licenseKey: string) => {
      setSubmitting(true);
      try {
        const res = (await api.request({
          url: '/license:license-key',
          method: 'POST',
          data: {
            licenseKey,
          },
        })) as ApiResponse<LicenseValidateResult>;

        const licenseValidateResult: LicenseValidateResult = res?.data?.data || {};

        if (licenseValidateResult.keyStatus === 'invalid') {
          modal.error({
            title: t('Invalid license key.'),
            content: t('The license key is invalid. Please visit the NocoBase Service to obtain a new license key.'),
          });
          return;
        }

        if (licenseValidateResult.licenseStatus === 'invalid') {
          modal.error({
            title: t('Invalid license key.'),
            content: t(
              'The current license key has been deprecated. Please visit the NocoBase Service to obtain a new license key.',
            ),
          });
          return;
        }

        if (licenseValidateResult.envMatch === false) {
          modal.error({
            title: t('Environment mismatch.'),
            content: (
              <>
                {licenseValidateResult.dbMatch === false && licenseValidateResult.sysMatch === false ? (
                  <>
                    {t(
                      'The current system and database do not match the licensed environment. Please use the new InstanceID to request a new license key.',
                    )}
                  </>
                ) : null}
                {licenseValidateResult.dbMatch === true && licenseValidateResult.sysMatch === false ? (
                  <>
                    {t(
                      'The current system does not match the licensed system. Please use the new InstanceID to request a new license key.',
                    )}
                  </>
                ) : null}
                {licenseValidateResult.dbMatch === false && licenseValidateResult.sysMatch === true ? (
                  <>
                    {t(
                      'The current database does not match the licensed database. Please use the new InstanceID to request a new license key.',
                    )}
                  </>
                ) : null}
              </>
            ),
          });
          return;
        }

        if (licenseValidateResult.domainMatch === false) {
          modal.error({
            title: t('Domain mismatch.'),
            content: t(
              'The current domain ({{domain}}) does not match the licensed domain. Please use the current domain to request a new license key.',
              {
                domain: licenseValidateResult.current?.domain,
                interpolation: { escapeValue: false },
              },
            ),
          });
          return;
        }

        setKeyExist(true);
        setIsEdit(false);
        setRefreshToken((token) => token + 1);
        form.resetFields();

        if (licenseValidateResult.isExpired === true) {
          message.success(t('The license key was saved successfully'), 5);
          modal.warning({
            title: t('The license has exceeded the upgrade validity period.'),
            content: t(
              'Plugins bound to this license can still be used but cannot be upgraded. To upgrade, please renew or repurchase the license.',
            ),
          });
          return;
        }

        if (licenseValidateResult.isPkgLogin === false) {
          message.success(t('The license key was saved successfully'), 5);
          modal.warning({
            title: t('Network error.'),
            content: t(
              'Due to network issues, plugins cannot be updated automatically (they are still usable). To update plugins, please check your network connection or refer to the NocoBase Service documentation to upload plugins manually.',
            ),
          });
          return;
        }

        message.success(
          t(
            'The license key has been saved successfully. Please restart the service, and the system will automatically install the plugin.',
          ),
        );
      } catch (err) {
        message.error(t('Network error. Please try again.'));
      } finally {
        setSubmitting(false);
      }
    },
    [api, form, message, modal, t],
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    await saveLicenseKey(values.licenseKey);
  }, [form, saveLicenseKey]);

  const LicenseCard = app.getComponent('LicenseCard', false) as ComponentType<LicenseCardComponentProps> | undefined;
  const shouldRenderLicenseCard = Boolean(LicenseCard && keyExist);

  return (
    <Card bordered={false}>
      <Spin spinning={checking}>
        <LicenseStatusPanel refreshToken={refreshToken} />
        <Form form={form} layout="vertical">
          <Form.Item label={t('Instance ID')}>
            <Button onClick={handleCopyInstanceId} icon={<CopyOutlined />} type="link" loading={copyingInstanceId}>
              {t('Copy')}
            </Button>
          </Form.Item>
          <Form.Item label={t('License key')} required={isEdit}>
            {isEdit ? (
              <Form.Item name="licenseKey" noStyle rules={[{ required: true, message: t('Enter license key') }]}>
                <Input.TextArea rows={4} placeholder={t('Enter license key')} />
              </Form.Item>
            ) : keyExist ? (
              <>
                {t('License key has been set')}&nbsp;
                <Button onClick={() => setIsEdit(true)}>{t('Change key')}</Button>
              </>
            ) : null}
          </Form.Item>
          {isEdit ? (
            <Form.Item>
              <Button type="primary" loading={submitting} onClick={handleSubmit}>
                {t('Submit')}
              </Button>
            </Form.Item>
          ) : null}
        </Form>
        {shouldRenderLicenseCard ? <LicenseCard key={refreshToken} /> : null}
      </Spin>
    </Card>
  );
}
