/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import {
  PoweredBy,
  RemoteSchemaComponent,
  useRequest,
  useAPIClient,
  SchemaComponentOptions,
  FormDialog,
  SchemaComponent,
  useGlobalTheme,
  FormItem,
} from '@nocobase/client';
import { QrcodeOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Dropdown, Space, Spin, Switch, Input, message, Checkbox, Popover, QRCode } from 'antd';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { FormLayout } from '@formily/antd-v5';
import { usePublicSubmitActionProps } from '../hooks';
import { useT } from '../locale';

const PublicFormQRCode = () => {
  const params = useParams();
  const [open, setOpen] = useState(false);
  const baseURL = window.location.origin;
  const link = `${baseURL}/public-forms/${params.name}`;
  const handleQRCodeOpen = (newOpen: boolean) => {
    setOpen(newOpen);
  };
  return (
    <Popover
      trigger={'hover'}
      open={open}
      onOpenChange={handleQRCodeOpen}
      content={open ? <QRCode value={link} bordered={false} /> : ' '}
    >
      QR code
    </Popover>
  );
};
export function AdminPublicFormPage() {
  const params = useParams();
  const t = useT();
  const { theme } = useGlobalTheme();
  const apiClient = useAPIClient();
  const { data, loading, refresh } = useRequest<any>({
    url: `publicForms:get/${params.name}`,
  });
  const { enabled, ...others } = data?.data || {};
  if (loading) {
    return <Spin />;
  }
  const handleEditPublicForm = async (values) => {
    await apiClient.resource('publicForms').update({
      filterByTk: params.name,
      values: { ...values },
    });
    await refresh();
  };

  const handleSetPassword = async () => {
    const values = await FormDialog(
      t('Password') as any,
      () => {
        return (
          <SchemaComponentOptions components={{ Checkbox, Input, FormItem }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    enabledPassword: {
                      type: 'boolean',
                      'x-decorator': 'FormItem',
                      'x-component': 'Checkbox',
                      title: t('Enabled password'),
                    },
                    password: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.Password',
                      title: t('Password'),
                      'x-reactions': {
                        dependencies: ['enabledPassword'],
                        fulfill: {
                          state: {
                            required: '{{$deps[0]}}',
                          },
                        },
                      },
                    },
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: { ...others },
    });
    const { enabledPassword, password } = values;
    await handleEditPublicForm({ enabledPassword, password });
  };

  const handleCopyLink = () => {
    const baseURL = window.location.origin;
    const link = `${baseURL}/public-forms/${params.name}`;
    navigator.clipboard.writeText(link);
    message.success(t('Link copied successfully'));
  };
  return (
    <div>
      <div
        style={{
          margin: '-24px',
          padding: '10px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to={`/admin/settings/public-forms`}>{t('Public forms')}</Link>,
            },
            {
              title: 'Test',
            },
          ]}
        />
        <Space>
          <Link target={'_blank'} to={`/public-forms/${params.name}`}>
            <Button disabled={!enabled} icon={<EyeOutlined />}>
              {t('Open form')}
            </Button>
          </Link>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'enabled',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{t('Enable form')}</span>{' '}
                      <Switch
                        size={'small'}
                        checked={enabled}
                        onChange={(checked) => handleEditPublicForm({ enabled: checked })}
                      />
                    </span>
                  ),
                },
                {
                  key: 'password',
                  label: <span onClick={handleSetPassword}> {t('Set password')}</span>,
                },
                {
                  key: 'divider1',
                  type: 'divider',
                },
                {
                  key: 'copyLink',
                  label: <span onClick={handleCopyLink}>{t('Copy link')}</span>,
                },
                {
                  key: 'qrcode',
                  label: <PublicFormQRCode />,
                },
              ],
            }}
          >
            <Button icon={<SettingOutlined />}>{t('Settings')}</Button>
          </Dropdown>
        </Space>
      </div>
      <div style={{ maxWidth: 800, margin: '100px auto' }}>
        {/* <Modal
          centered
          title={t('Password')}
          open={openPassword}
          onCancel={() => setOpenPassword(false)}
          onOk={() => {
            setOpenPassword(false);
            handleEditPublicForm({ password: pwd === '' ? null : pwd });
          }}
        >
          <Input.Password
            defaultValue={password}
            visibilityToggle={true}
            onChange={(e) => {
              setPwd(e.target.value);
            }}
          />
        </Modal> */}
        <RemoteSchemaComponent uid={params.name} scope={{ useCreateActionProps: usePublicSubmitActionProps }} />
        <PoweredBy />
      </div>
    </div>
  );
}
