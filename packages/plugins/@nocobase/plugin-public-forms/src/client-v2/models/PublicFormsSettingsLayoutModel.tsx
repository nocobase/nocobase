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
import { observer, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Breadcrumb, Button, Dropdown, Form, Popover, QRCode, Result, Space, Spin, Switch, theme } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useOutlet } from 'react-router-dom';
import { ensurePublicFormFlowModel, type PublicFormRecord } from '../modelTree';
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

type PublicFormsSettingsDetailViewProps = {
  pageUid?: string;
  children?: React.ReactNode | ((routeModel: FlowModel) => React.ReactNode);
};

export const PublicFormsSettingsDetailView = observer((props: PublicFormsSettingsDetailViewProps) => {
  const { pageUid, children } = props;
  const ctx = useFlowContext();
  const flowEngine = useFlowEngine();
  const t = useT();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const publicFormLink = usePublicFormLink(pageUid);
  const resource = ctx.api.resource('publicForms');
  const { data, loading, mutate } = useRequest(
    async () => {
      if (!pageUid) {
        return null;
      }
      const response = await resource.get({ filterByTk: pageUid });
      const nextRecord = normalizeRecordResponse(response);
      if (nextRecord?.key === pageUid && nextRecord.version === 'v2') {
        const routeModel = await ensurePublicFormFlowModel(flowEngine, nextRecord, t);
        return {
          record: nextRecord,
          routeModel,
        };
      }
      return null;
    },
    {
      refreshDeps: [pageUid],
    },
  );
  const record = data?.record?.key === pageUid ? data.record : null;
  const routeModel = data?.routeModel || null;

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
        record: {
          ...record,
          ...values,
        },
        routeModel,
      });
    },
    [mutate, record, resource, routeModel],
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
      content: () => (
        <PasswordForm
          record={record}
          onSubmitted={(values) =>
            mutate({
              record: {
                ...record,
                ...values,
              },
              routeModel,
            })
          }
        />
      ),
    });
  }, [ctx.viewer, mutate, record, routeModel, token.screenSM]);

  if (loading) {
    return <Spin />;
  }

  if (!record || !routeModel) {
    return <Result status="warning" title={t('The form is not found')} />;
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
        {typeof children === 'function' ? children(routeModel) : children}
      </div>
    </div>
  );
});

const PublicFormsSettingsLayoutComponent = observer((props: { model: PublicFormsSettingsLayoutModel }) => {
  const { model } = props;
  const outlet = useOutlet();
  const pageUid = model.getPageUidFromLayoutRoute(model.currentLayoutRoute);

  if (!outlet) {
    return null;
  }

  return <PublicFormsSettingsDetailView pageUid={pageUid}>{outlet}</PublicFormsSettingsDetailView>;
});

export class PublicFormsSettingsLayoutModel extends BaseLayoutModel {
  render() {
    return <PublicFormsSettingsLayoutComponent model={this} />;
  }
}

export default PublicFormsSettingsLayoutModel;
