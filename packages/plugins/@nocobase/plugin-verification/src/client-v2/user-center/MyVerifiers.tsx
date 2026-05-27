/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DialogFormLayout, useApp } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Alert, App, Form, List, Spin, Tabs, Tag } from 'antd';
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useT, useVerificationTranslation } from '../locale';
import PluginVerificationClientV2 from '../plugin';
import type { BindFormProps, VerificationFormProps } from '../verification-manager';

/**
 * `React.lazy` returns a brand-new component each call; calling it inside
 * render would re-mount the Suspense boundary on every paint. Cache per
 * verification type so the same lazy wrapper is reused across renders.
 */
function createLazyByType<P>() {
  const cache = new Map<string, React.LazyExoticComponent<React.ComponentType<P>>>();
  return (type: string, loader: () => Promise<{ default: React.ComponentType<P> }>) => {
    const cached = cache.get(type);
    if (cached) return cached;
    const wrapped = lazy(loader);
    cache.set(type, wrapped);
    return wrapped;
  };
}

type UserVerifier = {
  name: string;
  title?: string;
  description?: string;
  verificationType: string;
  verificationTypeTitle?: string;
  boundInfo?: {
    bound?: boolean;
    publicInfo?: string;
  };
};

const lazyBindFormByType = createLazyByType<BindFormProps>();

function BindDialogContent(props: { verifier: UserVerifier; onSubmitted: () => void }) {
  const { t } = useVerificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const app = useApp();
  const plugin = app.pm.get(PluginVerificationClientV2);
  const bindFormLoader = plugin?.verificationManager.getVerification(props.verifier.verificationType)?.components
    ?.BindFormLoader;
  const BindForm = useMemo(
    () => (bindFormLoader ? lazyBindFormByType(props.verifier.verificationType, bindFormLoader) : null),
    [bindFormLoader, props.verifier.verificationType],
  );
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  // Server returns titles as raw `{{ t("…", { ns: "…" }) }}` schema
  // templates. Compile through FlowI18n so the dialog title shows the
  // human-readable label instead of the literal expression.
  const dialogTitle = compileT(props.verifier.title || '') || t('Bind');

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await ctx.api.resource('verifiers').bind({
        values: {
          verifier: props.verifier.name,
          ...values,
        },
      });
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  });

  // When the verifier's type has no v2-registered BindForm (e.g. TOTP
  // — still v1-only at the time of writing), fall back to a friendly
  // warning. Otherwise the drawer renders an empty body and the user
  // sees nothing actionable.
  if (!BindForm) {
    return (
      <DialogFormLayout
        title={dialogTitle}
        onSubmit={async () => undefined}
        submitText={t('Close')}
        cancelText={t('Cancel')}
      >
        <Alert
          type="warning"
          showIcon
          message={t(
            'This verifier type ({{type}}) is not yet supported in the new client. Please switch to the legacy client to bind it.',
            { type: props.verifier.verificationType },
          )}
        />
      </DialogFormLayout>
    );
  }

  return (
    <DialogFormLayout
      title={dialogTitle}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Bind')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        <Suspense fallback={<Spin />}>
          <BindForm verifier={props.verifier.name} actionType="verifiers:bind" isLogged />
        </Suspense>
      </Form>
    </DialogFormLayout>
  );
}

const lazyVerificationFormByType = createLazyByType<VerificationFormProps>();

function UnbindDialogContent(props: {
  targetVerifier: UserVerifier;
  availableVerifiers: UserVerifier[];
  onSubmitted: () => void;
}) {
  const compileT = useT();
  const { t } = useVerificationTranslation();
  const ctx = useFlowContext();
  const app = useApp();
  const plugin = app.pm.get(PluginVerificationClientV2);
  // The user picks WHICH verifier to authenticate with on this drawer's
  // tab strip — `selectedVerifier` is the auth source, while
  // `targetVerifier` is the one being unbound.
  const initial = props.availableVerifiers[0]?.name;
  const [selectedVerifier, setSelectedVerifier] = useState<string | undefined>(initial);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useMemoizedFn(async () => {
    if (!selectedVerifier) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await ctx.api.resource('verifiers').unbind({
        values: {
          verifier: selectedVerifier,
          unbindVerifier: props.targetVerifier.name,
          ...values,
        },
      });
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  });

  const tabItems = props.availableVerifiers
    .map((verifier) => {
      const verificationFormLoader = plugin?.verificationManager.getVerification(verifier.verificationType)?.components
        ?.VerificationFormLoader;
      if (!verificationFormLoader) return null;
      const VerificationForm = lazyVerificationFormByType(verifier.verificationType, verificationFormLoader);
      const tabTitle =
        compileT(verifier.title || '') || compileT(verifier.verificationTypeTitle || verifier.verificationType);
      return {
        key: verifier.name,
        label: tabTitle,
        children: (
          // The form instance is shared across tabs but values are reset
          // when the user switches tabs (see onChange below). Each tab
          // re-renders a fresh VerificationForm bound to its own verifier.
          <Suspense fallback={<Spin />}>
            <VerificationForm
              verifier={verifier.name}
              actionType="verifiers:unbind"
              boundInfo={verifier.boundInfo}
              isLogged
            />
          </Suspense>
        ),
      };
    })
    .filter(Boolean) as { key: string; label: React.ReactNode; children: React.ReactNode }[];

  return (
    <DialogFormLayout
      title={t('Unbind verifier')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Unbind')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        {tabItems.length ? (
          <Tabs
            activeKey={selectedVerifier}
            onChange={(key) => {
              form.resetFields();
              setSelectedVerifier(key);
            }}
            destroyInactiveTabPane
            items={tabItems}
          />
        ) : (
          <span>{t('No verifier available to verify your identity.')}</span>
        )}
      </Form>
    </DialogFormLayout>
  );
}

function VerifierActions(props: { verifier: UserVerifier; onChanged: () => void }) {
  const { t } = useVerificationTranslation();
  const ctx = useFlowContext();
  const bound = !!props.verifier.boundInfo?.bound;

  // Match v1 UX: bind/unbind opens an antd Modal (dialog) with title
  // left + native top-right X close. `closable: true` overrides the
  // platform-level `closable={false}` default in `DialogComponent` so
  // antd Modal's built-in close button is restored.
  const openBind = useMemoizedFn(() => {
    ctx.viewer.dialog({
      closable: true,
      content: () => <BindDialogContent verifier={props.verifier} onSubmitted={() => props.onChanged()} />,
    });
  });

  const openUnbind = useMemoizedFn(async () => {
    const response = await ctx.api.resource('verifiers').listForVerify({ scene: 'unbind-verifier' });
    const verifiers: UserVerifier[] = response?.data?.data || [];
    ctx.viewer.dialog({
      closable: true,
      content: () => (
        <UnbindDialogContent
          targetVerifier={props.verifier}
          availableVerifiers={verifiers}
          onSubmitted={() => props.onChanged()}
        />
      ),
    });
  });

  return bound ? <a onClick={openUnbind}>{t('Unbind')}</a> : <a onClick={openBind}>{t('Bind')}</a>;
}

/**
 * Drawer content for the User Center's "Verification" entry. Lists
 * every verifier the current user can bind/unbind, with a Configured /
 * Not configured tag and a per-row action. Bind opens a type-specific
 * sub-drawer; Unbind opens a Tabs-based confirmation drawer that
 * authenticates the user with any other bound verifier before removing
 * the target.
 */
export function MyVerifiers() {
  const compileT = useT();
  const { t } = useVerificationTranslation();
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const { data, loading, refresh } = useRequest(async () => {
    const response = await ctx.api.resource('verifiers').listByUser();
    return (response?.data?.data || []) as UserVerifier[];
  });

  const onChanged = useMemoizedFn(() => {
    refresh();
    message.success(t('Operation succeeded'));
  });

  if (loading) {
    return <Spin />;
  }

  return (
    <List
      bordered
      dataSource={data || []}
      renderItem={(item) => (
        <List.Item actions={[<VerifierActions key="action" verifier={item} onChanged={onChanged} />]}>
          <List.Item.Meta
            title={
              <>
                {compileT(item.title || '')}{' '}
                {item.boundInfo?.bound ? (
                  <Tag color="success">{t('Configured')}</Tag>
                ) : (
                  <Tag color="warning">{t('Not configured')}</Tag>
                )}
              </>
            }
            description={compileT(item.description || '')}
          />
          <div>{item.boundInfo?.publicInfo}</div>
        </List.Item>
      )}
    />
  );
}

export default MyVerifiers;
