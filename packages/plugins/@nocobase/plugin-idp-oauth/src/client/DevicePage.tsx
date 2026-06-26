/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp } from '@nocobase/client';
import { Alert, Button, Card, Form, Input, Result, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from './locale';

type DeviceStateStatus =
  | 'missing_code'
  | 'not_found'
  | 'expired'
  | 'cancelled'
  | 'complete'
  | 'already_used'
  | 'login'
  | 'pending';

type DeviceState = {
  status: DeviceStateStatus;
  userCode?: string;
  clientName?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getDevicePath(appName: string, action = '') {
  const appPrefix = appName === 'main' ? '' : `__app/${appName}/`;
  return `${appPrefix}idpOAuth/device/verification${action}`;
}

function getCurrentDevicePath(userCode?: string) {
  const search = userCode ? `?user_code=${encodeURIComponent(userCode)}` : window.location.search;
  return `${window.location.pathname}${search}`;
}

export const DevicePage = () => {
  const api = useAPIClient();
  const app = useApp();
  const navigate = useNavigate();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);

  const userCode = useMemo(() => searchParams.get('user_code') || undefined, [searchParams]);

  const requestDeviceState = useCallback(
    async (action = '', data?: Record<string, unknown>) => {
      const response = await api.request({
        url: getDevicePath(app.name, action),
        method: action ? 'post' : 'get',
        skipNotify: true,
        params: action ? undefined : { user_code: userCode },
        data,
      });
      return (response?.data?.data || response?.data) as DeviceState;
    },
    [api, app.name, userCode],
  );

  const loadDeviceState = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const state = await requestDeviceState();
      setDeviceState(state);
      if (state.status === 'login') {
        navigate(`/signin?redirect=${encodeURIComponent(getCurrentDevicePath(state.userCode || userCode))}`, {
          replace: true,
        });
        return;
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, t('Failed to load device sign-in.')));
    } finally {
      setLoading(false);
    }
  }, [navigate, requestDeviceState, t, userCode]);

  useEffect(() => {
    loadDeviceState();
  }, [loadDeviceState]);

  const submitCode = useCallback(
    ({ user_code: value }: { user_code?: string }) => {
      const nextUserCode = value?.trim();
      if (!nextUserCode) {
        return;
      }

      setSearchParams({ user_code: nextUserCode });
    },
    [setSearchParams],
  );

  const submitDecision = useCallback(
    async (action: ':approve' | ':cancel') => {
      setSubmitting(true);
      setError(null);

      try {
        const state = await requestDeviceState(action, { user_code: deviceState?.userCode || userCode });
        setDeviceState(state);
      } catch (error: unknown) {
        setError(getErrorMessage(error, t('Failed to submit device sign-in.')));
      } finally {
        setSubmitting(false);
      }
    },
    [deviceState?.userCode, requestDeviceState, t, userCode],
  );

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin style={{ fontSize: 72 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <Alert type="error" message={error} showIcon />
      </div>
    );
  }

  if (!deviceState || deviceState.status === 'missing_code') {
    return (
      <div style={{ maxWidth: 440, margin: '48px auto', padding: '0 24px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3} style={{ marginBottom: 8 }}>
                {t('Device sign-in')}
              </Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {t('Enter the code shown in your terminal to continue signing in.')}
              </Typography.Paragraph>
            </div>
            <Form layout="vertical" onFinish={submitCode}>
              <Form.Item name="user_code" rules={[{ required: true, message: t('Enter the device code.') }]}>
                <Input autoFocus size="large" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>
                {t('Continue')}
              </Button>
            </Form>
          </Space>
        </Card>
      </div>
    );
  }

  if (deviceState.status === 'complete') {
    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <Result
          status="success"
          title={t('Device sign-in complete')}
          subTitle={t('Authorization is complete. You can return to the terminal.')}
        />
      </div>
    );
  }

  if (deviceState.status === 'cancelled') {
    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <Result
          status="warning"
          title={t('Device sign-in cancelled')}
          subTitle={t('The device sign-in request was cancelled.')}
        />
      </div>
    );
  }

  if (deviceState.status !== 'pending') {
    const errorMessages: Partial<Record<DeviceStateStatus, string>> = {
      not_found: t('The device code was not found.'),
      expired: t('The device code has expired.'),
      already_used: t('The device code has already been used.'),
    };

    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <Result status="error" title={t('Device sign-in failed')} subTitle={errorMessages[deviceState.status]} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 8 }}>
              {t('Confirm device')}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {t(
                '{{clientName}} is requesting access. Confirm that this code matches the one shown in your terminal.',
                {
                  clientName: deviceState.clientName || t('Application'),
                },
              )}
            </Typography.Paragraph>
          </div>
          <Typography.Title level={2} style={{ margin: 0, letterSpacing: '0.08em', textAlign: 'center' }}>
            {deviceState.userCode}
          </Typography.Title>
          <Space>
            <Button type="primary" loading={submitting} onClick={() => submitDecision(':approve')}>
              {t('Continue')}
            </Button>
            <Button loading={submitting} onClick={() => submitDecision(':cancel')}>
              {t('Cancel')}
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default DevicePage;
