/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useMemo, useState } from 'react';
import {
  ActionContextProvider,
  ExtendCollectionsProvider,
  SchemaComponent,
  useAPIClient,
  useCollectionRecordData,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import { verficatorsSchema, createVerificatorSchema } from '../schemas/verificators';
import verificators from '../../collections/verificators';
import { useVerificationTranslation } from '../locale';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { VerificationTypeContext, VerificationTypesContext, useVerificationTypes } from './verification-types';
import { Schema, observer, useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import PluginVerificationClient from '..';

const useCreateFormProps = () => {
  const { type } = useContext(VerificationTypeContext);
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          uid: `v_${uid()}`,
          verificationType: type,
        },
      }),
    [type],
  );
  return {
    form,
  };
};

const useEditFormProps = () => {
  const record = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: record,
      }),
    [record],
  );
  return {
    form,
  };
};

const AddNew = () => {
  const { t } = useVerificationTranslation();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const types = useVerificationTypes();
  const items = types.map((item) => ({
    ...item,
    onClick: () => {
      setVisible(true);
      setType(item.value);
    },
  }));

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <VerificationTypeContext.Provider value={{ type }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ setType, useCreateFormProps }} schema={createVerificatorSchema} />
      </VerificationTypeContext.Provider>
    </ActionContextProvider>
  );
};

export const useAdminSettingsForm = (verificationType: string) => {
  const plugin = usePlugin('verification') as PluginVerificationClient;
  const verification = plugin.verificationManager.getVerification(verificationType);
  return verification?.components?.AdminSettingsForm;
};

export const Settings = observer(
  () => {
    const form = useForm();
    const record = useCollectionRecordData();
    console.log(record);
    const Component = useAdminSettingsForm(form.values.verificationType || record.verificationType);
    return Component ? <Component /> : null;
  },
  { displayName: 'VerificationSettings' },
);

export const Verificators: React.FC = () => {
  const { t } = useVerificationTranslation();
  const [types, setTypes] = useState([]);
  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource('verificators')
        .listTypes()
        .then((res) => {
          const types = res?.data?.data || [];
          return types.map((type: { name: string; title?: string }) => ({
            key: type.name,
            label: Schema.compile(type.title || type.name, { t }),
            value: type.name,
          }));
        }),
    {
      onSuccess: (types) => {
        setTypes(types);
      },
    },
  );

  return (
    <VerificationTypesContext.Provider value={{ types }}>
      <ExtendCollectionsProvider collections={[verificators]}>
        <SchemaComponent
          schema={verficatorsSchema}
          components={{ AddNew, Settings }}
          scope={{ types, useEditFormProps }}
        />
      </ExtendCollectionsProvider>
    </VerificationTypesContext.Provider>
  );
};
