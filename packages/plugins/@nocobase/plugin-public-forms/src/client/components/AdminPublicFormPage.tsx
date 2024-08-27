/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { PoweredBy, RemoteSchemaComponent, useRequest } from '@nocobase/client';
import { Breadcrumb, Button, Dropdown, Space, Spin, Switch } from 'antd';
import React from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { usePublicSubmitActionProps } from '../hooks';

export function AdminPublicFormPage() {
  const params = useParams();
  const { error, data, loading } = useRequest<any>({
    url: `publicForms:get/${params.name}`,
  });
  if (loading) {
    return <Spin />;
  }
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
              title: <Link to={`/admin/settings/public-forms`}>Public forms</Link>,
            },
            {
              title: 'Test',
            },
          ]}
        />
        <Space>
          <Link target={'_blank'} to={`/public-forms/${params.name}`}>
            <Button icon={<EyeOutlined />}>Open form</Button>
          </Link>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'enabled',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Enable form</span> <Switch defaultChecked size={'small'} />
                    </span>
                  ),
                },
                {
                  key: 'password',
                  label: <span>Set password</span>,
                },
                {
                  key: 'divider1',
                  type: 'divider',
                },
                {
                  key: 'copyLink',
                  label: <span>Copy link</span>,
                },
                {
                  key: 'qrcode',
                  label: <span>Download QR code</span>,
                },
              ],
            }}
          >
            <Button icon={<SettingOutlined />}>Settings</Button>
          </Dropdown>
        </Space>
      </div>
      <div style={{ maxWidth: 800, margin: '100px auto' }}>
        <RemoteSchemaComponent uid={params.name} scope={{ useCreateActionProps: usePublicSubmitActionProps }} />
        <PoweredBy />
      </div>
    </div>
  );
}
