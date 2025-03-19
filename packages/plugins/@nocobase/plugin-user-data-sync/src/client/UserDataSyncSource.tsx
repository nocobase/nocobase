/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { createForm } from '@formily/core';
import { Schema, useForm } from '@formily/react';
import {
  ActionContextProvider,
  ActionProps,
  ExtendCollectionsProvider,
  ReadPretty,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequestGetter,
  useDataBlockResource,
  useRequest,
} from '@nocobase/client';
import { App as AntdApp, Button, Dropdown, Empty } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { Options, useValuesFromOptions } from './Options';
import { NAMESPACE, useUserDataSyncSourceTranslation } from './locale';
import {
  createFormSchema,
  sourceCollection,
  taskCollection,
  tasksTableBlockSchema,
  userDataSyncSourcesSchema,
} from './schemas/user-data-sync-sources';
import { SourceTypeContext, SourceTypesContext, useSourceTypes } from './sourceType';

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
  const form = useForm();
  const resource = useDataBlockResource();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
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
      await getDataBlockRequest()?.runAsync();
      setVisible(false);
    },
  };
};

function useDeleteActionProps(): ActionProps {
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const collection = useCollection();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { t } = useUserDataSyncSourceTranslation();
  return {
    confirm: {
      title: t('Delete', { ns: NAMESPACE }),
      content: t('Are you sure you want to delete it?', { ns: NAMESPACE }),
    },
    async onClick() {
      await resource.destroy({
        filterByTk: record[collection.filterTargetKey],
      });
      await getDataBlockRequest()?.runAsync();
    },
  };
}

function useSyncActionProps(): ActionProps {
  const { message } = AntdApp.useApp();
  const record = useCollectionRecordData();
  const api = useAPIClient();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { t } = useUserDataSyncSourceTranslation();
  return {
    hidden: !record?.enabled,
    async onClick() {
      await api.resource('userData').pull({ name: record['name'] });
      await getDataBlockRequest()?.runAsync();
      message.success(
        t("The synchronization has started. You can click on 'Tasks' to view the synchronization status.", {
          ns: NAMESPACE,
        }),
      );
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
  const record = useCollectionRecordData();
  const collection = useCollection();
  const api = useAPIClient();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  return {
    async onClick() {
      await api.resource('userData').retry({ id: record[collection.filterTargetKey], sourceId: record['sourceId'] });
      await getDataBlockRequest()?.runAsync();
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

const Message = () => {
  const { t } = useUserDataSyncSourceTranslation();
  const record = useCollectionRecordData();
  return <ReadPretty.Input value={t(record['message'])} ellipsis={true} />;
};

const Tasks = () => {
  const record = useCollectionRecordData();
  const { t } = useUserDataSyncSourceTranslation();
  const [visible, setVisible] = useState(false);
  return record.enabled ? (
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
        <SchemaComponent
          scope={{ useRetryActionProps, useTasksTableBlockProps, t }}
          components={{ Message }}
          schema={tasksTableBlockSchema}
        />
      </ExtendCollectionsProvider>
    </ActionContextProvider>
  ) : null;
};

const Retry = () => {
  const { t } = useUserDataSyncSourceTranslation();
  const record = useCollectionRecordData();
  if (record.status !== 'failed') {
    return null;
  }
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
          retry: {
            title: '{{ t("Retry") }}',
            'x-component': 'Action.Link',
            'x-use-component-props': 'useRetryActionProps',
          },
        },
      }}
    />
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
          components={{ AddNew, Options, Tasks, Retry }}
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
