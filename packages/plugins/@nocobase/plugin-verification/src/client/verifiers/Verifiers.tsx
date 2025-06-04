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
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  usePlugin,
  useRequest,
} from '@nocobase/client';
import { verifiersSchema, createVerifierSchema } from '../schemas/verifiers';
import verifiers from '../../collections/verifiers';
import { useVerificationTranslation } from '../locale';
import { Button, Dropdown, App } from 'antd';
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
          name: `v_${uid()}`,
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

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
      form.reset();
    },
  };
};

const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const { t } = useVerificationTranslation();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.create({
        values,
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const collection = useCollection();
  const filterTk = collection.getFilterTargetKey();
  const { t } = useVerificationTranslation();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.update({
        values,
        filterByTk: values[filterTk],
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
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
        <SchemaComponent scope={{ setType, useCreateFormProps }} schema={createVerifierSchema} />
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
    const Component = useAdminSettingsForm(form.values.verificationType || record.verificationType);
    return Component ? <Component /> : null;
  },
  { displayName: 'VerificationSettings' },
);

export const Verifiers: React.FC = () => {
  const { t } = useVerificationTranslation();
  const [types, setTypes] = useState([]);
  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource('verifiers')
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
      <ExtendCollectionsProvider collections={[verifiers]}>
        <SchemaComponent
          schema={verifiersSchema}
          components={{ AddNew, Settings }}
          scope={{ types, useEditFormProps, useCancelActionProps, useCreateActionProps, useEditActionProps }}
        />
      </ExtendCollectionsProvider>
    </VerificationTypesContext.Provider>
  );
};
