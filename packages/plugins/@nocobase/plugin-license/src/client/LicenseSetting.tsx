/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { SchemaComponent, useAPIClient, useFormBlockContext } from '@nocobase/client';
import { Card, Typography, Spin, message } from 'antd';
import { useAsyncEffect } from 'ahooks';
import { useT } from './locale';

const { Paragraph } = Typography;

function InstanceId() {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [instanceId, setInstanceId] = useState('');

  const getInstanceId = async () => {
    setLoading(true);
    return api
      .request({
        url: '/license:instance-id',
        method: 'GET',
      })
      .then((res) => res?.data?.data)
      .finally(() => {
        setLoading(false);
      });
  };
  useAsyncEffect(async () => {
    const id = await getInstanceId();
    setInstanceId(id);
  }, []);

  return (
    <Spin spinning={loading}>
      <Paragraph copyable ellipsis>
        {instanceId}
      </Paragraph>
    </Spin>
  );
}

const useSubmitProps = () => {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const ctx = useFormBlockContext();
  const t = useT();

  const saveLicenseKey = async (licenseKey: string) => {
    setLoading(true);
    try {
      await api.request({
        url: '/license:license-key',
        method: 'POST',
        data: {
          licenseKey,
        },
      });
      setLoading(false);
      message.success(t('License key saved successfully, please restart the server'));
    } catch (e) {
      setLoading(false);
    }
  };

  return {
    loading,
    onClick: async () => {
      await ctx.form?.validate();
      const licenseKey = ctx.form?.values?.licenseKey;
      await saveLicenseKey(licenseKey);
    },
  };
};

export default function LicenseSetting() {
  const t = useT();

  const createLabelSchema = {
    type: 'void',
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      dataSource: 'main',
      collection: 'users',
    },
    properties: {
      form: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFormBlockProps',
        properties: {
          label: {
            type: 'string',
            title: t('Instance ID'),
            // required: true,
            'x-component': 'InstanceId',
            'x-decorator': 'FormItem',
          },
          licenseKey: {
            type: 'string',
            title: t('License key'),
            required: true,
            'x-component': 'Input.TextArea',
            'x-decorator': 'FormItem',
            'x-component-props': {
              placeholder: t('Enter license key'),
            },
          },
          footer: {
            type: 'void',
            'x-component': 'Action.Drawer.Footer',
            properties: {
              submit: {
                title: '{{t("Submit")}}',
                'x-component': 'Action',
                'x-use-component-props': 'useSubmitProps',
                'x-component-props': {
                  type: 'primary',
                },
              },
            },
          },
        },
      },
    },
  };
  return (
    <Card bordered={false}>
      <SchemaComponent
        scope={{ useSubmitProps }}
        components={{ InstanceId }}
        schema={{
          type: 'void',
          properties: {
            form: createLabelSchema,
          },
        }}
      />
    </Card>
  );
}
