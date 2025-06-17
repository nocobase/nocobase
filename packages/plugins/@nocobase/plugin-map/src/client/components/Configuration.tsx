/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TextAreaWithGlobalScope, useAPIClient, useCompile, useLocationSearch } from '@nocobase/client';
import { Button, Card, Form, Tabs, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { MapTypes } from '../constants';
import { MapConfigurationResourceKey, getSSKey, useMapConfiguration } from '../hooks';
import { useMapTranslation } from '../locale';

interface BaseConfigurationProps {
  type: 'amap' | 'google';
}
const BaseConfiguration: React.FC<BaseConfigurationProps> = ({ type, children }) => {
  const { t } = useMapTranslation();
  const apiClient = useAPIClient();
  const [form] = Form.useForm();
  const data = useMapConfiguration(type, false);
  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data]);

  const resource = useMemo(() => {
    return apiClient.resource(MapConfigurationResourceKey);
  }, [apiClient]);

  function removeInvisibleCharsFromObject(obj: Record<string, string>): Record<string, string | null> {
    const cleanObj: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // 去除不可见字符
        const cleanedValue = value.replace(/[\p{C}\p{Z}\p{Zl}\p{Zp}]+/gu, '');
        // 如果清理后为空字符串，则赋值为 null
        cleanObj[key] = cleanedValue || null;
      }
    }

    return cleanObj;
  }
  const onSubmit = async (values) => {
    // 移除不可见字符并更新表单值
    const result = removeInvisibleCharsFromObject(values);
    form.setFieldsValue(result);

    // 等待表单值更新完成后再校验
    await new Promise((resolve) => setTimeout(resolve, 0));
    await form.validateFields();
    resource
      .set({
        ...removeInvisibleCharsFromObject(values),
        type,
      })
      .then((res) => {
        sessionStorage.removeItem(getSSKey(type));
        message.success(t('Saved successfully'));
      })
      .catch((err) => {
        message.success(t('Saved failed'));
      });
  };
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      {children}
      <Form.Item>
        <Button disabled={false} type="primary" htmlType="submit">
          {t('Submit')}
        </Button>
      </Form.Item>
    </Form>
  );
};

const AMapConfiguration = () => {
  const { t } = useMapTranslation();
  return (
    <BaseConfiguration type="amap">
      <Form.Item
        rules={[{ required: true, message: t('Access key is required') }]}
        name="accessKey"
        label={t('Access key')}
      >
        <TextAreaWithGlobalScope />
      </Form.Item>
      <Form.Item
        rules={[{ required: true, message: t('securityJsCode or serviceHost is required') }]}
        name="securityJsCode"
        label={t('securityJsCode or serviceHost')}
      >
        <TextAreaWithGlobalScope />
      </Form.Item>
    </BaseConfiguration>
  );
};

const GoogleMapConfiguration = () => {
  const { t } = useMapTranslation();
  return (
    <BaseConfiguration type="google">
      <Form.Item rules={[{ required: true, message: t('Api key is required') }]} name="accessKey" label={t('Api key')}>
        <TextAreaWithGlobalScope />
      </Form.Item>
    </BaseConfiguration>
  );
};

const components = {
  amap: AMapConfiguration,
  google: GoogleMapConfiguration,
  yandex: YandexMapConfiguration,
};
const YandexMapConfiguration = () => {
  const { t } = useMapTranslation();
  return (
    <BaseConfiguration type="yandex">
      <Form.Item rules={[{ required: true, message: t('Api key is required') }]} name="accessKey" label={t('Api key')}>
        <TextAreaWithGlobalScope />
      </Form.Item>
    </BaseConfiguration>
  );
};

const routeList = MapTypes.map((item) => {
  return {
    ...item,
    component: components[item.value],
  };
});

export const Configuration = () => {
  const compile = useCompile();
  const searchString = useLocationSearch();
  const search = new URLSearchParams(searchString);
  return (
    <Card bordered>
      <Tabs type="card" defaultActiveKey={search.get('tab')}>
        {routeList.map((tab) => {
          return (
            <Tabs.TabPane key={tab.value} tab={compile(tab.label)}>
              <tab.component type={tab.value} />
            </Tabs.TabPane>
          );
        })}
      </Tabs>
    </Card>
  );
};
