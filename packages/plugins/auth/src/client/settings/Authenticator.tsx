import { ActionContext, SchemaComponent, useActionContext } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { authenticatorsSchema, createFormSchema } from './schemas/authenticators';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { action } from '@formily/reactive';
import { AuthTypeContext, useAuthTypes } from './authType';
import { Configure, useUpdateOptionsAction, useValuesFromOptions } from './Configure';
import { useAuthTranslation } from '../locale';

const useAsyncDataSource = (service) => (field) => {
  field.loading = true;
  return service(field).then(
    action.bound((data) => {
      field.dataSource = data;
      field.loading = false;
    }),
  );
};

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const AddNew = () => {
  const { t } = useAuthTranslation();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const { types, getAuthTypes } = useAuthTypes();
  const items = types.map((item) => ({
    ...item,
    onClick: () => {
      setVisible(true);
      setType(item.value);
    },
  }));

  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <AuthTypeContext.Provider value={{ type }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ useCloseAction, useAsyncDataSource, getAuthTypes }} schema={createFormSchema} />
      </AuthTypeContext.Provider>
    </ActionContext.Provider>
  );
};

export const Authenticator = () => {
  const { getAuthTypes } = useAuthTypes();
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={authenticatorsSchema}
        components={{ AddNew, Configure }}
        scope={{ useAsyncDataSource, getAuthTypes, useUpdateOptionsAction, useValuesFromOptions }}
      />
    </Card>
  );
};
