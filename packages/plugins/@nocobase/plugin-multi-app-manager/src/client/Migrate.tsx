/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Modal, message, Select, Form } from 'antd';
import { usePluginUtils } from './utils';
import { useAPIClient, useRequest, useResourceActionContext } from '@nocobase/client';
import { CloudSyncOutlined } from '@ant-design/icons';

const MigrateModal: React.FC<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const { t } = usePluginUtils();
  const api = useAPIClient();
  const { state, setState } = useResourceActionContext();
  const [environmentOptions, setEnvironmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [migrating, setMigrating] = useState(false);

  useRequest(
    () =>
      api
        .request({
          url: 'appEnvironments:list',
        })
        .then((res: any) => res.data?.data || []),
    {
      onSuccess: (data) => {
        const availableEnvs = data.filter(({ available }) => available);
        if (!availableEnvs.length) {
          return;
        }
        setEnvironmentOptions(availableEnvs.map(({ name }) => ({ value: name, label: name })));
      },
    },
  );

  return (
    <Modal
      title={t('Migrate to app supervisor')}
      closable={true}
      open={open}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setOpen(false);
          }}
        >
          {t('Cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={migrating}
          onClick={async () => {
            if (!state?.selectedRowKeys?.length) {
              return message.error(t('Please select the records you want to migrate'));
            }
            setMigrating(true);
            await form.validateFields();
            try {
              await api.resource('apps').migrate({
                values: {
                  appNames: state?.selectedRowKeys,
                  environments: form.getFieldValue('environments'),
                },
              });
            } finally {
              setState?.({ selectedRowKeys: [] });
              setOpen(false);
              setMigrating(false);
            }
          }}
        >
          {t('Submit')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" colon={true}>
        <Form.Item label={t('Environments')} name="environments" rules={[{ required: true }]}>
          <Select options={environmentOptions} mode="multiple" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const Migrate: React.FC = () => {
  const { t } = usePluginUtils();
  const api = useAPIClient();
  const { state } = useResourceActionContext();
  const [open, setOpen] = useState(false);

  const { loading, data } = useRequest<{
    enabled: boolean;
  }>(() =>
    api
      .silent()
      .resource('pm')
      .get({
        filterByTk: 'app-supervisor',
      })
      .then((res) => res?.data?.data),
  );

  if (loading || !data?.enabled) {
    return null;
  }

  return (
    <>
      <Button
        icon={<CloudSyncOutlined />}
        onClick={async () => {
          if (!state?.selectedRowKeys?.length) {
            return message.error(t('Please select the records you want to migrate'));
          }
          setOpen(true);
        }}
      >
        {t('Migrate to app supervisor')}
      </Button>
      <MigrateModal open={open} setOpen={setOpen} />
    </>
  );
};
