import { useAPIClient, useCompile } from '@nocobase/client';
import { useBoolean } from 'ahooks';
import { Button, Card, Form, Input, Tabs, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MapTypes } from '../constants';
import { MapConfigurationResourceKey, getSSKey, useMapConfiguration } from '../hooks';
import { useMapTranslation } from '../locale';

interface BaseConfigurationProps {
  type: 'amap' | 'google';
}
const BaseConfiguration: React.FC<BaseConfigurationProps> = ({ type, children }) => {
  const { t } = useMapTranslation();
  const [isDisabled, disableAction] = useBoolean(false);
  const apiClient = useAPIClient();
  const [form] = Form.useForm();
  const data = useMapConfiguration(type);
  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
      disableAction.toggle();
    }
  }, [data]);

  const resource = useMemo(() => {
    return apiClient.resource(MapConfigurationResourceKey);
  }, [apiClient]);

  const onSubmit = (values) => {
    resource
      .set({
        ...values,
        type,
      })
      .then((res) => {
        sessionStorage.removeItem(getSSKey(type));
        disableAction.toggle();
        message.success(t('Saved successfully'));
      })
      .catch((err) => {
        message.success(t('Saved failed'));
      });
  };
  return (
    <Form disabled={isDisabled} form={form} layout="vertical" onFinish={onSubmit}>
      {children}
      {isDisabled ? (
        <Button disabled={false} onClick={disableAction.toggle}>
          {t('Edit')}
        </Button>
      ) : (
        <Form.Item>
          <Button disabled={false} type="primary" htmlType="submit">
            {t('Save')}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

const AMapConfiguration = () => {
  const { t } = useMapTranslation();
  return (
    <BaseConfiguration type="amap">
      <Form.Item required name="accessKey" label={t('Access key')}>
        <Input />
      </Form.Item>
      <Form.Item required name="securityJsCode" label={t('securityJsCode or serviceHost')}>
        <Input />
      </Form.Item>
    </BaseConfiguration>
  );
};

const GoogleMapConfiguration = () => {
  const { t } = useMapTranslation();
  return (
    <BaseConfiguration type="google">
      <Form.Item required name="accessKey" label={t('Api key')}>
        <Input />
      </Form.Item>
    </BaseConfiguration>
  );
};

const components = {
  amap: AMapConfiguration,
  google: GoogleMapConfiguration,
};

const tabList = MapTypes.map((item) => {
  return {
    ...item,
    component: components[item.value],
  };
});

export const Configuration = () => {
  const compile = useCompile();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  return (
    <Card bordered>
      <Tabs type="card" defaultActiveKey={search.get('tab')}>
        {tabList.map((tab) => {
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
