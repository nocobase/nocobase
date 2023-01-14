import { useAPIClient, useCompile } from '@nocobase/client';
import { useBoolean } from 'ahooks';
import { Button, Card, Form, Input, message, Tabs } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { MapTypes } from '../constants';
import { MapConfigurationResourceKey, useMapConfiguration } from '../hooks';
import { useMapTranslation } from '../locale';

const AMapConfiguration = ({ type }) => {
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
        message.success(t('Saved successfully'));
      })
      .catch((err) => {
        message.success(t('Saved failed'));
      });
  };
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item required name="accessKey" label={t('Access key')}>
        <Input disabled={isDisabled} />
      </Form.Item>
      <Form.Item required name="securityJsCode" label={t('securityJsCode or serviceHost')}>
        <Input disabled={isDisabled} />
      </Form.Item>
      {isDisabled ? (
        <Button onClick={disableAction.toggle} type="ghost">
          {t('Edit')}
        </Button>
      ) : (
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('Save')}
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

const components = {
  amap: AMapConfiguration,
  google: () => <div>Coming soon</div>,
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
