/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { SchemaComponent, useAPIClient, useFormBlockContext } from '@nocobase/client';
import { Card, Typography, Spin, message, Input, Button, Alert, Modal } from 'antd';
import { useAsyncEffect } from 'ahooks';
import { useT } from './locale';
import { CopyOutlined } from '@ant-design/icons';
import { ServiceValidate } from './ServiceValidate';
import { useForm } from '@formily/react';
import { useSubmitProps } from './useSubmitProps';
import { LicenseSettingContext } from './LicenseSettingContext';

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
      {t('Copy')}
    </Button>
  );
}

const TextArea = (props) => {
  const [isExists, setIsExists] = useState(false);
  const api = useAPIClient();
  const ctx = useFormBlockContext();
  const form = useForm();
  const t = useT();
  useAsyncEffect(async () => {
    const res = await api.request({
      url: '/license:is-exists',
      method: 'GET',
    });
    if (res?.data?.data) {
      form?.setFieldState('footer', (state) => {
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
            form?.setFieldState('footer', (state) => {
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
  const [renderKey, setRenderKey] = useState(0);

  const createLabelSchema = {
    type: 'void',
    'x-decorator': 'Form',
    properties: {
      form: {
        type: 'void',
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
                  style: {
                    marginBottom: 16,
                  },
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
      <LicenseSettingContext.Provider
        value={{
          onSaveSuccess: () => {
            setRenderKey((k) => k + 1);
          },
        }}
      >
        <ServiceValidate refreshToken={renderKey} />
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
        <SchemaComponent
          key={renderKey}
          schema={{
            type: 'void',
            properties: {
              card: {
                type: 'void',
                'x-component': 'LicenseCard',
                'x-component-props': {
                  notShowIfKeyNotExist: true,
                },
              },
            },
          }}
        />
      </LicenseSettingContext.Provider>
    </Card>
  );
}
