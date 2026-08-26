/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table, VariableInput, VariableTextArea } from '@nocobase/client-v2';
import { useFlowContext, type MetaTreeNode } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Alert, Checkbox, Form, InputNumber, Radio, Select, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthTranslation, useT } from '../locale';

type SignupFieldRow = {
  field: string;
  show?: boolean;
  required?: boolean;
};

/**
 * Forgot-password email templates may reference these scopes. Server-side
 * renderer expands them at delivery time — the picker only needs to surface
 * them as selectable variables. `$env` is namespace-filtered from the global
 * meta tree; the rest are static leaves passed as `extraNodes`.
 *
 * Note: nested `$user.*` / `$systemSettings.*` paths are hard-coded to match
 * the legacy server template contract. When `$user` / `$systemSettings` are
 * formally registered on the v2 flow context, this list can be replaced with
 * a namespace filter.
 */
function useForgotPasswordExtraNodes(): MetaTreeNode[] {
  const { t } = useAuthTranslation();
  return useMemo(
    () => [
      {
        name: '$user',
        title: t('Current user'),
        type: 'object',
        paths: ['$user'],
        children: [
          { name: 'username', title: t('Username'), type: 'string', paths: ['$user', 'username'] },
          { name: 'nickname', title: t('Nickname'), type: 'string', paths: ['$user', 'nickname'] },
          { name: 'email', title: t('Email'), type: 'string', paths: ['$user', 'email'] },
        ],
      },
      {
        name: '$systemSettings',
        title: t('System settings'),
        type: 'object',
        paths: ['$systemSettings'],
        children: [
          { name: 'title', title: t('System title'), type: 'string', paths: ['$systemSettings', 'title'] },
          { name: 'logo', title: t('System logo'), type: 'string', paths: ['$systemSettings', 'logo'] },
        ],
      },
      {
        name: '$resetLink',
        title: t('Reset password link'),
        type: 'string',
        paths: ['$resetLink'],
      },
      {
        name: '$resetLinkExpiration',
        title: t('Reset link expiration (minutes)'),
        type: 'string',
        paths: ['$resetLinkExpiration'],
      },
    ],
    [t],
  );
}

const FORGOT_PASSWORD_NAMESPACES = ['$env'];

function useUsersFields() {
  const ctx = useFlowContext();
  return useMemo(() => {
    // v2 `Collection.fields` is a `Map<string, CollectionField>` — calling
    // `.filter` on it throws. Use `getFields()` which returns an array
    // (and also merges inherited collections, matching v1 behavior).
    //
    // `hidden` is a raw DB option in v2 (no getter on CollectionField), so
    // read it through `.options`. The remaining checks use the typed getters.
    const collection = ctx.dataSourceManager?.getCollection?.('main', 'users');
    const fields = collection?.getFields?.() ?? [];
    return fields.filter(
      (field) =>
        field && !field.options?.hidden && !field.target && field.interface && !field.uiSchema?.['x-read-pretty'],
    );
  }, [ctx]);
}

function SignupFormTable(props: { value?: SignupFieldRow[]; onChange?: (next: SignupFieldRow[]) => void }) {
  const { t } = useAuthTranslation();
  const compileT = useT();
  const fields = useUsersFields();
  // Stabilise the empty-array fallback so the `value` dep doesn't change every
  // render and re-trigger the reconcile memo below.
  const value = useMemo(() => props.value ?? [], [props.value]);

  // Reconcile: drop entries whose backing field no longer exists, then append
  // any new fields with sensible defaults (username/email visible & required).
  const reconciled = useMemo<SignupFieldRow[]>(() => {
    const fieldNames = new Set(fields.map((field) => field.name));
    const kept = value.filter((row) => fieldNames.has(row.field));
    const known = new Set(kept.map((row) => row.field));
    for (const field of fields) {
      if (!known.has(field.name)) {
        kept.push({
          field: field.name,
          show: field.name === 'username',
          required: field.name === 'username',
        });
      }
    }
    return kept;
  }, [fields, value]);

  // Sync the reconciled value back to the parent form on mount / collection
  // changes so re-renders are stable. Guard against echoing identical arrays.
  React.useEffect(() => {
    const sameLength = value.length === reconciled.length;
    const same =
      sameLength &&
      value.every(
        (row, index) =>
          row.field === reconciled[index].field &&
          !!row.show === !!reconciled[index].show &&
          !!row.required === !!reconciled[index].required,
      );
    if (!same) {
      props.onChange?.(reconciled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconciled]);

  const updateRow = useMemoizedFn((fieldName: string, patch: Partial<SignupFieldRow>) => {
    const next = reconciled.map((row) => {
      if (row.field !== fieldName) return row;
      const merged = { ...row, ...patch };
      // Show is forced on whenever Required is on; Required is forced off when Show is off.
      if (merged.required) merged.show = true;
      if (!merged.show) merged.required = false;
      return merged;
    });
    props.onChange?.(next);
  });

  // Field titles on the `users` collection are stored as legacy Schema
  // templates (e.g. `{{t("Nickname")}}`). `useT()` routes through
  // `flowEngine.context.t`, which natively expands those templates — no
  // `Schema.compile` needed.
  const fieldTitle = useMemoizedFn((fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    const raw = field?.uiSchema?.title || field?.options?.title || fieldName;
    return compileT(raw);
  });

  const columns = useMemo<ColumnsType<SignupFieldRow>>(
    () => [
      {
        title: t('Field'),
        dataIndex: 'field',
        width: 200,
        // v1 wrapped field names in a bordered Tag — keep the same chip
        // affordance so the row reads as a *field reference* and not free
        // text. `bordered` is implicit on the default Tag.
        render: (fieldName) => <Tag>{fieldTitle(fieldName)}</Tag>,
      },
      {
        title: t('Show'),
        dataIndex: 'show',
        width: 80,
        align: 'center',
        render: (_, row) => (
          <Checkbox checked={!!row.show} onChange={(event) => updateRow(row.field, { show: event.target.checked })} />
        ),
      },
      {
        title: t('Required'),
        dataIndex: 'required',
        width: 80,
        align: 'center',
        render: (_, row) => (
          <Checkbox
            checked={!!row.required}
            onChange={(event) => updateRow(row.field, { required: event.target.checked })}
          />
        ),
      },
      // Filler: antd Table stretches to fill its container, so without a
      // trailing column every sized column gets the slack — including Field.
      // An empty, unsized column absorbs the remainder instead.
      { title: '', dataIndex: '_filler', render: () => null },
    ],
    [fieldTitle, t, updateRow],
  );

  const handleSortEnd = useMemoizedFn((from: SignupFieldRow, to: SignupFieldRow) => {
    const fromIndex = reconciled.findIndex((row) => row.field === from.field);
    const toIndex = reconciled.findIndex((row) => row.field === to.field);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const next = [...reconciled];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    props.onChange?.(next);
  });

  return (
    <Table<SignupFieldRow>
      rowKey="field"
      pagination={false}
      columns={columns}
      dataSource={reconciled}
      isDraggable
      onSortEnd={handleSortEnd}
      sortHandleColumnWidth={32}
      showIndex={false}
    />
  );
}

function SignUpTab() {
  const { t } = useAuthTranslation();
  return (
    <>
      <Form.Item
        name={['options', 'public', 'allowSignUp']}
        label={t('Allow to sign up')}
        valuePropName="checked"
        initialValue
      >
        <Checkbox />
      </Form.Item>
      <Form.Item label={t('Sign up form')} name={['options', 'public', 'signupForm']} validateFirst>
        <SignupFormTable />
      </Form.Item>
    </>
  );
}

function useNotificationChannels(enabled: boolean) {
  const ctx = useFlowContext();
  return useRequest(
    async () => {
      const response = await ctx.api.resource('notificationChannels').list({
        filter: { notificationType: 'email' },
        pageSize: 50,
      });
      const data = response?.data?.data ?? response?.data;
      return Array.isArray(data) ? data : [];
    },
    {
      ready: enabled,
      cacheKey: '@nocobase/plugin-auth:notificationChannels:email',
      refreshDeps: [enabled],
    },
  );
}

function ForgotPasswordTab() {
  const { t } = useAuthTranslation();
  const form = Form.useFormInstance();
  const enableResetPassword: boolean = Form.useWatch(['options', 'public', 'enableResetPassword'], form);
  const emailContentType: 'html' | 'text' = Form.useWatch(['options', 'emailContentType'], form) || 'html';
  const extraNodes = useForgotPasswordExtraNodes();
  const { data: channels, loading: channelsLoading } = useNotificationChannels(!!enableResetPassword);

  const channelOptions = useMemo(
    () => (channels || []).map((channel: any) => ({ label: channel.title, value: channel.name })),
    [channels],
  );

  return (
    <>
      <Form.Item
        name={['options', 'public', 'enableResetPassword']}
        label={t('Enable forget password')}
        valuePropName="checked"
        initialValue={false}
      >
        <Checkbox />
      </Form.Item>
      {enableResetPassword ? (
        <>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {t('1. Select notification channel')}
          </Typography.Title>
          <Form.Item
            name={['options', 'notificationChannel']}
            label={t('Notification channel (Email)')}
            extra={t('The notification channel used to send the reset password email, only support email channel')}
            rules={[{ required: true, message: t('Please select a notification channel') }]}
          >
            <Select
              loading={channelsLoading}
              options={channelOptions}
              placeholder={t('Select')}
              notFoundContent={
                <span>
                  {t('No notification channels found. Please ')}
                  <Link to="/admin/settings/notification-manager/channels">{t('add one first')}</Link>.
                </span>
              }
            />
          </Form.Item>
          <Typography.Title level={5}>{t('2. Configure reset email')}</Typography.Title>
          <Form.Item
            name={['options', 'emailSubject']}
            label={t('Subject')}
            rules={[{ required: true, message: t('Please enter the email subject') }]}
            initialValue={t('defaultResetPasswordEmailSubject')}
          >
            <VariableInput namespaces={FORGOT_PASSWORD_NAMESPACES} extraNodes={extraNodes} />
          </Form.Item>
          <Form.Item
            name={['options', 'emailContentType']}
            label={t('Content type')}
            initialValue="html"
            rules={[{ required: true }]}
          >
            <Radio.Group
              options={[
                { label: 'HTML', value: 'html' },
                { label: t('Plain text'), value: 'text' },
              ]}
            />
          </Form.Item>
          {emailContentType === 'html' ? (
            <Form.Item
              key="html"
              name={['options', 'emailContentHTML']}
              label={t('Content')}
              rules={[{ required: true, message: t('Please enter the email content') }]}
              initialValue={t('defaultResetPasswordEmailContentHTML')}
            >
              <VariableTextArea
                namespaces={FORGOT_PASSWORD_NAMESPACES}
                extraNodes={extraNodes}
                placeholder="Hi,"
                rows={10}
              />
            </Form.Item>
          ) : (
            <Form.Item
              key="text"
              name={['options', 'emailContentText']}
              label={t('Content')}
              rules={[{ required: true, message: t('Please enter the email content') }]}
              initialValue={t('defaultResetPasswordEmailContentText')}
            >
              <VariableTextArea namespaces={FORGOT_PASSWORD_NAMESPACES} extraNodes={extraNodes} rows={10} />
            </Form.Item>
          )}
          <Form.Item
            name={['options', 'resetTokenExpiresIn']}
            label={t('Reset link expiration')}
            initialValue={120}
            rules={[{ required: true, message: t('Please enter the expiration in minutes') }]}
          >
            <InputNumber min={1} addonAfter={t('Minutes')} style={{ width: '100%' }} />
          </Form.Item>
        </>
      ) : null}
    </>
  );
}

/**
 * v2 rewrite of plugin-auth's preset `Options.tsx`. Rendered inside the
 * Authenticators page drawer below the common fields (`name`, `authType`,
 * `title`, `description`, `enabled`). Two tabs — sign up form configuration
 * and forgot-password email template — match the v1 layout shown to admins.
 *
 * All `Form.Item` names live under the parent form's `['options', ...]`
 * path, so submitted values land on the authenticator record as
 * `options.public.allowSignUp` / `options.notificationChannel` / etc., the
 * same shape the v1 schema produced and the server expects.
 */
export default function BasicAuthAdminSettings() {
  const { t } = useAuthTranslation();
  return (
    <div>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message={t('The authentication allows users to sign in via username or email.')}
      />
      {/*
        `forceRender: true` 让所有 tab 的内容首屏就 mount —— 否则非 active tab 里的
        `Form.Item` 从未注册到父抽屉表单的 value store，提交时会把那些字段当成"用户清空"，
        覆盖掉服务端已有的值。v1 用 Formily `FormTab` 默认就是全 mount，所以没这个坑。
      */}
      <Tabs
        items={[
          { key: 'signup', label: t('Sign up settings'), forceRender: true, children: <SignUpTab /> },
          { key: 'forgot', label: t('Forgot password'), forceRender: true, children: <ForgotPasswordTab /> },
        ]}
      />
    </div>
  );
}
