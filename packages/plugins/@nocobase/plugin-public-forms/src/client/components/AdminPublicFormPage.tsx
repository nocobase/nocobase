/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { PoweredBy, RemoteSchemaComponent, useRequest, useAPIClient } from '@nocobase/client';
import { Breadcrumb, Button, Dropdown, Space, Spin, Switch, Modal, Input } from 'antd';
import React, { useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { usePublicSubmitActionProps } from '../hooks';
import { useT } from '../locale';
export function AdminPublicFormPage() {
  const params = useParams();
  const t = useT();
  const [pwd, setPwd] = useState('');
  const [openPassword, setOpenPassword] = useState(false);
  const apiClient = useAPIClient();
  const { data, loading, refresh } = useRequest<any>({
    url: `publicForms:get/${params.name}`,
  });
  const { enabled, password } = data?.data || {};
  if (loading) {
    return <Spin />;
  }
  const handleEditPublicForm = async (values) => {
    const { data } = await apiClient.resource('publicForms').update({
      filterByTk: params.name,
      values: { ...values },
    });
    await refresh();
  };

  const handleSetPassword = () => {
    setOpenPassword(true);
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
                  label: <span>{t('Copy link')}</span>,
                  disabled: !enabled,
                },
                {
                  key: 'qrcode',
                  label: <span>{t('Download QR code')}</span>,
                  disabled: !enabled,
                },
              ],
            }}
          >
            <Button icon={<SettingOutlined />}>{t('Settings')}</Button>
          </Dropdown>
        </Space>
      </div>
      <div style={{ maxWidth: 800, margin: '100px auto' }}>
        <Modal
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
        </Modal>
        <RemoteSchemaComponent uid={params.name} scope={{ useCreateActionProps: usePublicSubmitActionProps }} />
        <PoweredBy />
      </div>
    </div>
  );
}
