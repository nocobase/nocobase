/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TextAreaWithContextSelector } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { Button, Card, Form, Tabs, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { MapConfigurationResourceKey, getSSKey, useMapConfig } from '../hooks';
import { useT } from '../locale';

interface BaseConfigurationProps {
  type: 'amap' | 'google';
  children?: React.ReactNode;
}

function removeInvisibleCharsFromObject(obj: Record<string, string>): Record<string, string | null> {
  const cleanObj: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[\p{C}\p{Z}\p{Zl}\p{Zp}]+/gu, '');
      cleanObj[key] = cleanedValue || null;
    }
  }
  return cleanObj;
}

const BaseConfiguration: React.FC<BaseConfigurationProps> = ({ type, children }) => {
  const t = useT();
  const { api } = useFlowContext();
  const [form] = Form.useForm();
  const data = useMapConfig(type, false);

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const resource = useMemo(() => api.resource(MapConfigurationResourceKey), [api]);

  const onSubmit = async (values) => {
    const cleanedValues = removeInvisibleCharsFromObject(values);
    form.setFieldsValue(cleanedValues);
    await Promise.resolve();
    await form.validateFields();
    try {
      await resource.set({
        ...cleanedValues,
        type,
      });
      sessionStorage.removeItem(getSSKey(type));
      message.success(t('Saved successfully'));
    } catch {
      message.error(t('Saved failed'));
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      {children}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {t('Submit')}
        </Button>
      </Form.Item>
    </Form>
  );
};

const AMapConfiguration = () => {
  const t = useT();
  return (
    <BaseConfiguration type="amap">
      <Form.Item
        rules={[{ required: true, message: t('Access key is required') }]}
        name="accessKey"
        label={t('Access key')}
      >
        <TextAreaWithContextSelector />
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: t('securityJsCode or serviceHost is required') }]}
        name="securityJsCode"
        label={t('securityJsCode or serviceHost')}
      >
        <TextAreaWithContextSelector />
      </Form.Item>
    </BaseConfiguration>
  );
};

const GoogleMapConfiguration = () => {
  const t = useT();
  return (
    <BaseConfiguration type="google">
      <Form.Item rules={[{ required: true, message: t('Api key is required') }]} name="accessKey" label={t('Api key')}>
        <TextAreaWithContextSelector />
      </Form.Item>
    </BaseConfiguration>
  );
};

const components = {
  amap: AMapConfiguration,
  google: GoogleMapConfiguration,
};

const Configuration = () => {
  const t = useT();
  const params = new URLSearchParams(window.location.search);
  return (
    <Card bordered>
      <Tabs
        type="card"
        defaultActiveKey={params.get('tab') || 'amap'}
        items={[
          { key: 'amap', label: t('AMap'), children: React.createElement(components.amap) },
          { key: 'google', label: t('Google Maps'), children: React.createElement(components.google) },
        ]}
      />
    </Card>
  );
};

export default Configuration;
