import { useAPIClient, useCompile, useRequest } from '@nocobase/client';
import { Form, Input, Tabs, Button, Card, message } from 'antd';
import React, { useMemo } from 'react';
import { MapTypes } from '../constants';
import { useMapTranslation } from '../locales';

const MapConfigurationResourceKey = 'map-configuration';
const AMapConfiguration = ({ type }) => {
  const { t } = useMapTranslation();
  useRequest({
    resource: MapConfigurationResourceKey,
    action: 'get',
    params: {
      type,
    },
  });
  const apiClient = useAPIClient();

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
        message.success(t('Saved successfully'));
      })
      .catch((err) => {
        message.success(t('Saved failed'));
      });
  };
  return (
    <Form layout="vertical" onFinish={onSubmit}>
      <Form.Item required name="accessKey" label={t('Access key')}>
        <Input />
      </Form.Item>
      <Form.Item required name="securityJsCode" label={t('securityJsCode or serviceHost')}>
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {t('保存')}
        </Button>
      </Form.Item>
    </Form>
  );
};

const components = {
  amap: AMapConfiguration,
  google: () => <div>Google</div>,
};

const tabList = MapTypes.map((item) => {
  return {
    ...item,
    component: components[item.value],
  };
});

const Configuration = () => {
  const compile = useCompile();
  return (
    <Card bordered>
      <Tabs type="card">
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

export default Configuration;
