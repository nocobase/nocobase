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
import { Card, Typography, Spin, message, Input, Button } from 'antd';
import { useAsyncEffect } from 'ahooks';
import { useT } from './locale';
import { CopyOutlined } from '@ant-design/icons';

const copyTextToClipboard = ({
  text,
  onSuccess,
  onError,
}: {
  text: string;
  onSuccess?: () => void;
  onError?: () => void;
}) => {
  if (!navigator.clipboard) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess?.();
    } catch (err) {
      onError?.();
    }
    document.body.removeChild(textArea);
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      onSuccess?.();
    })
    .catch((e) => {
      console.error(e);
      onError?.();
    });
};

function InstanceId() {
  const api = useAPIClient();
  const [loading, setLoading] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const t = useT();

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

  return (
    <Button
      onClick={async () => {
        const id = await getInstanceId();
        copyTextToClipboard({
          text: id,
          onSuccess: () => {
            message.success(t('Copied'));
          },
          onError: () => {
            message.error(t('Failed to copy, please open ./storage/.license/instance-id and copy it'));
          },
        });
      }}
      loading={loading}
      icon={<CopyOutlined />}
      type="link"
    >
      {t('Click to copy')}
    </Button>
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
      message.success(t('License key saved successfully, please re-run the plugin installation.'));
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

const TextArea = (props) => {
  const [isExists, setIsExists] = useState(false);
  const api = useAPIClient();
  const ctx = useFormBlockContext();
  const t = useT();
  useAsyncEffect(async () => {
    const res = await api.request({
      url: '/license:is-exists',
      method: 'GET',
    });
    if (res?.data?.data) {
      ctx.form?.setFieldState('footer', (state) => {
        state.visible = false;
      });
    }
    setIsExists(res?.data?.data);
  }, []);

  if (isExists) {
    return (
      <>
        {t('License key has been set')}&nbsp;
        <Button
          onClick={() => {
            setIsExists(false);
            ctx.form?.setFieldState('footer', (state) => {
              state.visible = true;
            });
          }}
        >
          {t('Change key')}
        </Button>
      </>
    );
  }
  return <Input.TextArea rows={4} {...props} />;
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
            'x-component': 'TextArea',
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
        components={{ InstanceId, TextArea }}
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
