import { SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState, useEffect } from 'react';
import { authenticatorsSchema } from './schemas/authenticators';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { action } from '@formily/reactive';

const useAuthTypes = () => {
  const api = useAPIClient();
  const [types, setTypes] = useState([]);
  const getAuthTypes = async () =>
    api
      .resource('authenticators')
      .listTypes()
      .then((res) => {
        const types = res?.data?.data || [];
        return types.map((type: string) => ({
          key: type,
          label: type,
        }));
      });
  useRequest(getAuthTypes, {
    onSuccess: (types) => {
      setTypes(types);
    },
  });
  return { types, getAuthTypes };
};

const AddNew = () => {
  const { t } = useTranslation();
  const { types: items } = useAuthTypes();

  return (
    <Dropdown menu={{ items }}>
      <Button icon={<PlusOutlined />} type={'primary'}>
        {t('Add new')} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export const Authenticator = () => {
  const { getAuthTypes } = useAuthTypes();
  const useAsyncDataSource = (service) => (field) => {
    field.loading = true;
    return service(field).then(
      action.bound((data) => {
        field.dataSource = data;
        field.loading = false;
      }),
    );
  };
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={authenticatorsSchema}
        components={{ AddNew }}
        scope={{ useAsyncDataSource, getAuthTypes }}
      />
    </Card>
  );
};
