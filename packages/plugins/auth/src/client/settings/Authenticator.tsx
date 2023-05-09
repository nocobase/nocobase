import {
  ActionContext,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useAsyncData,
  useRequest,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { authenticatorsSchema, createFormSchema } from './schemas/authenticators';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { AuthTypeContext, AuthTypesContext, useAuthTypes } from './authType';
import { Options, useValuesFromOptions } from './Options';
import { useTranslation } from 'react-i18next';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const AddNew = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const types = useAuthTypes();
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
        <SchemaComponent scope={{ useCloseAction, types }} schema={createFormSchema} />
      </AuthTypeContext.Provider>
    </ActionContext.Provider>
  );
};

// Disable delete button when there is only one authenticator
const useCanNotDelete = () => {
  const { data } = useAsyncData();
  // return data?.meta?.count === 1;
  return false;
};

export const Authenticator = () => {
  const [types, setTypes] = useState([]);
  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource('authenticators')
        .listTypes()
        .then((res) => {
          const types = res?.data?.data || [];
          return types.map((type: string) => ({
            key: type,
            label: type,
            value: type,
          }));
        }),
    {
      onSuccess: (types) => {
        setTypes(types);
      },
    },
  );

  return (
    <Card bordered={false}>
      <AuthTypesContext.Provider value={{ types }}>
        <SchemaComponent
          schema={authenticatorsSchema}
          components={{ AddNew, Options }}
          scope={{ types, useValuesFromOptions, useCanNotDelete }}
        />
      </AuthTypesContext.Provider>
    </Card>
  );
};
