import { APIClient, SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { authenticatorsSchema } from './schemas/authenticators';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Menu } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { action } from '@formily/reactive';

const getTypes = async (api: APIClient) => {
  const res = await api.resource('authenticators').listTypes();
  const types = res?.data?.data || [];
  return types.map((type: string) => ({
    key: type,
    label: type,
  }));
};

const AddNew = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [menu, setMenu] = useState<MenuProps['items']>([]);
  useRequest(() => getTypes(api), {
    onSuccess: (types) => {
      setMenu(types);
    },
  });

  return (
    <Dropdown menu={{ items: menu }}>
      <Button icon={<PlusOutlined />} type={'primary'}>
        {t('Add new')} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export const Authenticator = () => {
  const api = useAPIClient();
  const getTypesWithAPI = () => getTypes(api);
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
        scope={{ useAsyncDataSource, getTypesWithAPI }}
      />
    </Card>
  );
};
