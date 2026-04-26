/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useApp } from '@nocobase/client';
import { Alert, Button, Card, Result, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type InteractionResponse = {
  prompt?: 'login' | 'consent';
  redirectTo?: string;
  clientName?: string;
  details?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const InteractionPage = () => {
  const api = useAPIClient();
  const app = useApp();
  const navigate = useNavigate();
  const params = useParams<{ uid: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionResponse | null>(null);

  const interactionApiPath = useMemo(() => {
    if (!params.uid) {
      return null;
    }
    if (app.name === 'main') {
      return `idpOAuth/interaction/${params.uid}`;
    }
    return `__app/${app.name}/idpOAuth/interaction/${params.uid}`;
  }, [app.name, params.uid]);

  const currentPath = useMemo(() => {
    if (!params.uid) {
      return '/signin';
    }
    return `/idp-oauth/interaction/${params.uid}`;
  }, [params.uid]);

  const runInteraction = useCallback(
    async (method: 'get' | 'post', payload?: Record<string, any>) => {
      if (!interactionApiPath) {
        setError('Invalid interaction path');
        setLoading(false);
        return;
      }

      const token = api.auth.getToken();
      const authenticator = api.auth.getAuthenticator() || 'basic';

      const response = await api.request({
        url: interactionApiPath,
        method,
        skipNotify: true,
        withCredentials: true,
        data: method === 'post' ? payload : undefined,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              'X-Authenticator': authenticator,
            }
          : undefined,
      });

      const data = response?.data?.data || response?.data;
      if (data?.redirectTo) {
        window.location.replace(data.redirectTo);
        return;
      }

      if (data?.prompt === 'login') {
        if (!token) {
          navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
          return;
        }

        if (method === 'get') {
          await runInteraction('post');
          return;
        }

        navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
        return;
      }

      setInteraction(data);
      setLoading(false);
    },
    [api, currentPath, interactionApiPath, navigate],
  );

  const onSubmit = useCallback(
    async (cancel = false) => {
      setLoading(true);
      setError(null);

      try {
        await runInteraction('post', cancel ? { cancel: 1 } : { submit: 1 });
      } catch (error: unknown) {
        setError(getErrorMessage(error, 'Failed to submit interaction'));
        setLoading(false);
      }
    },
    [runInteraction],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await runInteraction('get');
      } catch (error: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(error, 'Failed to load interaction'));
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [runInteraction]);

  useEffect(() => {
    if (interaction?.prompt !== 'consent' || loading) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) {
        return;
      }
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ae = document.activeElement;
        if (ae instanceof HTMLButtonElement || ae instanceof HTMLAnchorElement) {
          return;
        }
        e.preventDefault();
        void onSubmit(false);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        void onSubmit(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [interaction?.prompt, loading, onSubmit]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
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

  if (interaction?.prompt === 'consent') {
    return (
      <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3} style={{ marginBottom: 8 }}>
                Authorize application
              </Typography.Title>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {interaction.clientName || 'Application'} requests access to your account.
              </Typography.Paragraph>
            </div>
            {interaction.details ? (
              <Alert type="info" showIcon message="Requested permissions" description={interaction.details} />
            ) : null}
            <Space>
              <Button type="primary" loading={loading} onClick={() => onSubmit(false)}>
                Continue
              </Button>
              <Button loading={loading} onClick={() => onSubmit(true)}>
                Cancel
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
      <Result title="Redirecting..." subTitle="Please wait while authorization continues." />
    </div>
  );
};

export default InteractionPage;
