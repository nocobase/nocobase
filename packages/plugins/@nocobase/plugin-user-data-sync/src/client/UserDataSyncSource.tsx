/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useRequest,
  ExtendCollectionsProvider,
  useDataBlockRequest,
  useDataBlockResource,
  useCollection,
  useCollectionRecordData,
  ActionProps,
} from '@nocobase/client';
import { App as AntdApp } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import {
  userDataSyncSourcesSchema,
  createFormSchema,
  sourceCollection,
  tasksTableBlockSchema,
} from './schemas/user-data-sync-sources';
import { Button, Dropdown, Empty } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { SourceTypeContext, SourceTypesContext, useSourceTypes } from './sourceType';
import { useValuesFromOptions, Options } from './Options';
import { NAMESPACE, useUserDataSyncSourceTranslation } from './locale';
import { Schema, useForm } from '@formily/react';
import { taskCollection } from './schemas/user-data-sync-sources';
import { createForm } from '@formily/core';

const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        values: recordData,
      }),
    [],
  );

  return {
    form,
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const collection = useCollection();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values,
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        await resource.create({ values });
      }
      await runAsync();
      message.success('Saved successfully');
      setVisible(false);
    },
  };
};

function useDeleteActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const { runAsync } = useDataBlockRequest();
  return {
    confirm: {
      title: 'Delete',
      content: 'Are you sure you want to delete it?',
    },
    async onClick() {
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      await runAsync();
      message.success('Deleted!');
    },
  };
}

function useSyncActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const api = useAPIClient();
  const { runAsync } = useDataBlockRequest();
  return {
    async onClick() {
      await api.resource('userData').pull({ name: record['name'] });
      await runAsync();
      message.success('Synced!');
    },
  };
}

const useCustomFormProps = () => {
  const { type: sourceType } = useContext(SourceTypeContext);
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          sourceType: sourceType,
        },
      }),
    [],
  );
  return {
    form,
  };
};

const useTasksTableBlockProps = () => {
  const record = useCollectionRecordData();
  const collection = useCollection();
  return {
    params: {
      pageSize: 20,
      filter: {
        sourceId: record[collection.filterTargetKey],
      },
      sort: ['-sort'],
    },
  };
};

function useRetryActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const api = useAPIClient();
  const { runAsync } = useDataBlockRequest();
  return {
    async onClick() {
      await api.resource('userData').retry({ id: record[collection.filterTargetKey], sourceId: record['sourceId'] });
      await runAsync();
      message.success('Successfully');
    },
  };
}

const AddNew = () => {
  const { t } = useUserDataSyncSourceTranslation();
  const api = useAPIClient();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const types = useSourceTypes();
  const items = types.map((item) => ({
    ...item,
    onClick: () => {
      setVisible(true);
      setType(item.value);
    },
  }));

  const emptyItem = [
    {
      key: '__empty__',
      label: (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              {t('No user data source plugin installed', { ns: NAMESPACE })}
              <br />{' '}
              <a
                target="_blank"
                href={
                  api.auth.locale === 'zh-CN'
                    ? 'https://docs-cn.nocobase.com/handbook/user-data-sync'
                    : 'https://docs.nocobase.com/handbook/user-data-sync'
                }
                rel="noreferrer"
              >
                {t('View documentation', { ns: NAMESPACE })}
              </a>
            </>
          }
        />
      ),
      onClick: () => {},
    },
  ];

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <SourceTypeContext.Provider value={{ type }}>
        <Dropdown menu={{ items: items && items.length > 0 ? items : emptyItem }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ types, setType, useCustomFormProps }} schema={createFormSchema} />
      </SourceTypeContext.Provider>
    </ActionContextProvider>
  );
};

const Tasks = () => {
  const { t } = useUserDataSyncSourceTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <Button
        type={'link'}
        onClick={() => {
          setVisible(true);
        }}
      >
        {t('Tasks')}
      </Button>
      <ExtendCollectionsProvider collections={[taskCollection]}>
        <SchemaComponent scope={{ useRetryActionProps, useTasksTableBlockProps }} schema={tasksTableBlockSchema} />
      </ExtendCollectionsProvider>
    </ActionContextProvider>
  );
};

export const UserDataSyncSource: React.FC = () => {
  const { t } = useUserDataSyncSourceTranslation();
  const [types, setTypes] = useState([]);
  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource('userData')
        .listSyncTypes()
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
    <SourceTypesContext.Provider value={{ types }}>
      <ExtendCollectionsProvider collections={[sourceCollection]}>
        <SchemaComponent
          schema={userDataSyncSourcesSchema}
          components={{ AddNew, Options, Tasks }}
          scope={{
            types,
            t,
            useEditFormProps,
            useSubmitActionProps,
            useDeleteActionProps,
            useSyncActionProps,
            useValuesFromOptions,
          }}
        />
      </ExtendCollectionsProvider>
    </SourceTypesContext.Provider>
  );
};
