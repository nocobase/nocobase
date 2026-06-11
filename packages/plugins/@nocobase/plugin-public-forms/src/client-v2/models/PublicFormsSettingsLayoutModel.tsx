/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { BaseLayoutModel, DrawerFormLayout, EnvVariableInput } from '@nocobase/client-v2';
import { observer, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Breadcrumb, Button, Dropdown, Form, Popover, QRCode, Space, Spin, Switch, theme } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useOutlet } from 'react-router-dom';
import type { PublicFormRecord } from '../modelTree';
import { useT } from '../locale';
import { getPublicFormRoutePath } from '../route';

function normalizeRecordResponse(response: any): PublicFormRecord | null {
  return response?.data?.data || response?.data || null;
}

function usePublicFormLink(name?: string) {
  const ctx = useFlowContext();
  return useMemo(() => {
    if (!name) {
      return '';
    }
    const pathname = getPublicFormRoutePath(ctx.app, `/public-forms/${name}`);
    return new URL(pathname, window.location.origin).toString();
  }, [ctx.app, name]);
}

const PublicFormQRCode = (props: { link: string }) => {
  const { link } = props;
  const t = useT();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      trigger="hover"
      placement="bottom"
      open={open}
      onOpenChange={setOpen}
      content={open ? <QRCode value={link} bordered={false} /> : ' '}
      zIndex={token.zIndexPopupBase + 100}
    >
      <a>{t('QR code')}</a>
    </Popover>
  );
};

function PasswordForm(props: { record: PublicFormRecord; onSubmitted: (values: Partial<PublicFormRecord>) => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const resource = ctx.api.resource('publicForms');

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await resource.update({
        filterByTk: record.key,
        values,
      });
      onSubmitted(values);
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmitted, record.key, resource]);

  return (
    <DrawerFormLayout
      title={t('Set password')}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      submitting={submitting}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={{ password: record.password }}>
        <Form.Item name="password" label={t('Password')}>
          <EnvVariableInput password />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

const PublicFormsSettingsLayoutComponent = observer((props: { model: PublicFormsSettingsLayoutModel }) => {
  const { model } = props;
  const outlet = useOutlet();
  const ctx = useFlowContext();
  const t = useT();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const pageUid = model.getPageUidFromLayoutRoute(model.currentLayoutRoute);
  const publicFormLink = usePublicFormLink(pageUid);
  const resource = ctx.api.resource('publicForms');
  const { data, mutate } = useRequest(
    async () => {
      if (!pageUid) {
        return null;
      }
      const response = await resource.get({ filterByTk: pageUid });
      return normalizeRecordResponse(response);
    },
    {
      refreshDeps: [pageUid],
    },
  );
  const record = data?.key === pageUid ? (data as PublicFormRecord) : null;

  const handleUpdate = useCallback(
    async (values: Partial<PublicFormRecord>) => {
      if (!record?.key) {
        return;
      }
      await resource.update({
        filterByTk: record.key,
        values,
      });
      mutate({
        ...record,
        ...values,
      });
    },
    [mutate, record, resource],
  );

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(publicFormLink);
    message.success(t('Link copied successfully'));
  }, [message, publicFormLink, t]);

  const handleSetPassword = useCallback(() => {
    if (!record) {
      return;
    }
    ctx.viewer.drawer({
      width: token.screenSM,
      closable: true,
      content: () => <PasswordForm record={record} onSubmitted={(values) => mutate({ ...record, ...values })} />,
    });
  }, [ctx.viewer, mutate, record, token.screenSM]);

  if (!outlet) {
    return null;
  }

  if (!record) {
    return <Spin />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginLG,
        height: `calc(100dvh - var(--nb-header-height) - ${token.controlHeightLG + token.paddingLG * 3}px)`,
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: token.margin,
          flexWrap: 'wrap',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to="/admin/settings/public-forms">{t('Public forms')}</Link>,
            },
            {
              title: record.title,
            },
          ]}
        />
        <Space wrap>
          <Button
            disabled={!record.enabled}
            icon={<EyeOutlined />}
            onClick={() => window.open(publicFormLink, '_blank', 'noopener,noreferrer')}
          >
            {t('Open form')}
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'enabled',
                  label: (
                    <a onClick={() => handleUpdate({ enabled: !record.enabled })}>
                      <Space>
                        <span>{t('Enable form')}</span>
                        <Switch size="small" checked={!!record.enabled} />
                      </Space>
                    </a>
                  ),
                },
                {
                  key: 'password',
                  label: <a onClick={handleSetPassword}>{t('Set password')}</a>,
                },
                {
                  key: 'divider',
                  type: 'divider',
                },
                {
                  key: 'copyLink',
                  label: <a onClick={handleCopyLink}>{t('Copy link')}</a>,
                },
                {
                  key: 'qrcode',
                  label: <PublicFormQRCode link={publicFormLink} />,
                },
              ],
            }}
          >
            <Button icon={<SettingOutlined />}>{t('Settings')}</Button>
          </Dropdown>
        </Space>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          position: 'relative',
          width: '100%',
        }}
      >
        {outlet}
      </div>
    </div>
  );
});

export class PublicFormsSettingsLayoutModel extends BaseLayoutModel {
  render() {
    return <PublicFormsSettingsLayoutComponent model={this} />;
  }
}

export default PublicFormsSettingsLayoutModel;
