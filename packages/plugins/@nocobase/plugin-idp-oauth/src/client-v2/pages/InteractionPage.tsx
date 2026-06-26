/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { Alert, Button, Card, Result, Space, Spin, Typography, theme } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '../locale';

type InteractionResponse = {
  prompt?: 'login' | 'consent';
  redirectTo?: string;
  clientName?: string;
  details?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function CenteredSpin() {
  return <Result icon={<Spin size="large" />} />;
}

function PageShell(props: React.PropsWithChildren) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        maxWidth: token.screenMD,
        marginInline: 'auto',
        paddingBlock: token.paddingXL,
        paddingInline: token.paddingLG,
      }}
    >
      {props.children}
    </div>
  );
}

export default function InteractionPage() {
  const app = useApp();
  const navigate = useNavigate();
  const params = useParams<{ uid: string }>();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionResponse | null>(null);

  const interactionApiPath = useMemo(() => {
    if (!params.uid) {
      return null;
    }

    const appName = app.getName?.() || app.name || 'main';
    if (appName === 'main') {
      return `idpOAuth/interaction/${params.uid}`;
    }
    return `__app/${appName}/idpOAuth/interaction/${params.uid}`;
  }, [app, params.uid]);

  const currentPath = useMemo(() => {
    if (!params.uid) {
      return '/signin';
    }
    return `/idp-oauth/interaction/${params.uid}`;
  }, [params.uid]);

  const consentDescription = useMemo(() => {
    const clientName = interaction?.clientName || t('Application');
    return `${clientName} ${t('requests access to your account.')}`;
  }, [interaction?.clientName, t]);

  const runInteraction = useCallback(
    async (method: 'get' | 'post', payload?: Record<string, number>) => {
      if (!interactionApiPath) {
        setError(t('Invalid interaction path'));
        setLoading(false);
        return null;
      }

      const token = app.apiClient.auth.getToken();
      const authenticator = app.apiClient.auth.getAuthenticator() || 'basic';

      const response = await app.apiClient.request({
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
        return null;
      }

      if (data?.prompt === 'login') {
        navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
        return null;
      }

      return data as InteractionResponse | null;
    },
    [app, currentPath, interactionApiPath, navigate, t],
  );

  const submitInteraction = useCallback(
    async (cancel = false) => {
      setLoading(true);
      setError(null);

      try {
        const data = await runInteraction('post', cancel ? { cancel: 1 } : { submit: 1 });
        if (!data) {
          return;
        }
        setInteraction(data);
        setLoading(false);
      } catch (submitError: unknown) {
        setError(getErrorMessage(submitError, t('Failed to submit interaction')));
        setLoading(false);
      }
    },
    [runInteraction, t],
  );

  useEffect(() => {
    if (!interactionApiPath) {
      setError(t('Invalid interaction path'));
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadInteraction = async () => {
      try {
        const data = await runInteraction('get');
        if (cancelled || !data) {
          return;
        }
        setInteraction(data);
        setLoading(false);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, t('Failed to load interaction')));
          setLoading(false);
        }
      }
    };

    loadInteraction();

    return () => {
      cancelled = true;
    };
  }, [interactionApiPath, runInteraction, t]);

  useEffect(() => {
    if (interaction?.prompt !== 'consent' || loading || !interactionApiPath) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLButtonElement || activeElement instanceof HTMLAnchorElement) {
          return;
        }
        event.preventDefault();
        const request = submitInteraction(false);
        request.catch(() => undefined);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        const request = submitInteraction(true);
        request.catch(() => undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [interaction?.prompt, interactionApiPath, loading, submitInteraction]);

  if (loading) {
    return <CenteredSpin />;
  }

  if (error) {
    return (
      <PageShell>
        <Alert type="error" message={error} showIcon />
      </PageShell>
    );
  }

  if (interaction?.prompt === 'consent') {
    return (
      <PageShell>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3}>{t('Authorize application')}</Typography.Title>
              <Typography.Paragraph>{consentDescription}</Typography.Paragraph>
            </div>
            {interaction.details ? (
              <Alert type="info" showIcon message={t('Requested permissions')} description={interaction.details} />
            ) : null}
            <Space>
              <Button type="primary" onClick={async () => submitInteraction(false)}>
                {t('Continue')}
              </Button>
              <Button onClick={async () => submitInteraction(true)}>{t('Cancel')}</Button>
            </Space>
          </Space>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Result title={t('Redirecting...')} subTitle={t('Please wait while authorization continues.')} />
    </PageShell>
  );
}
