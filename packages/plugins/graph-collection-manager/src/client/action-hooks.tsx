import React, { useEffect, useContext } from 'react';
import { action } from '@formily/reactive';
import { useTranslation } from 'react-i18next';
import omit from 'lodash/omit';
import { message, Select } from 'antd';
import { useActionContext, useRequest, useAPIClient, useCompile, useCollectionManager } from '@nocobase/client';
import { observer, useForm } from '@formily/react';
import { GraphCollectionContext } from './components/CollectionNodeProvder';
import {useGraphPosions} from './GraphPositionProvider';
export const useValuesFromRecord = (options, data) => {
  const result = useRequest(() => Promise.resolve({ data }), {
    ...options,
    manual: true,
  });
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      result.run();
    }
  }, [ctx.visible]);
  return result;
};

export const SourceCollection = observer(() => {
  const { record } = useContext(GraphCollectionContext);
  const compile = useCompile();
  return (
    <div>
      <Select disabled value={record.name} options={[{ value: record.name, label: compile(record.title) }]} />
    </div>
  );
});

export const useCancelAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      ctx.setVisible(false);
      form.reset();
    },
  };
};

export const useCreateActionAndRefreshCM = (GraphRef) => {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  return {
    async run() {
      await form.submit();
      await api.resource('collections').create({ values: form.values });
      ctx.setVisible(false);
      await form.reset();
      await GraphRef.current.refreshCM();
    },
  };
};

export const useCreateAction = (collectionName, targetId) => {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refreshCM } = useCollectionManager();
  const { positionTargetNode } = useContext(GraphCollectionContext);

  return {
    async run() {
      await form.submit();
      const {
        data: { data },
      } = await api.resource('collections.fields', collectionName).create({ values: form.values });
      await api.resource('fields').move({
        sourceId: data.key,
        targetId,
        targetScope: collectionName,
        method: 'insertAfter',
      });
      ctx.setVisible(false);
      await form.reset();
      positionTargetNode();
      await refreshCM();
    },
  };
};

export const useUpdateFieldAction = ({ collectionName, name }) => {
  const { refreshCM } = useCollectionManager();
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const { positionTargetNode } = useContext(GraphCollectionContext);
  return {
    async run() {
      await form.submit();
      await api.resource('collections.fields', collectionName).update({
        filterByTk: name,
        values: form.values,
      });
      ctx.setVisible(false);
      await form.reset();
      message.success(t('Saved successfully'));
      positionTargetNode();
      refreshCM();
    },
  };
};

export const useUpdateCollectionActionAndRefreshCM = () => {
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const { name } = form.values;
  const api = useAPIClient();
  const { refreshCM } = useCollectionManager();
  const { positionTargetNode } = useContext(GraphCollectionContext);
  return {
    async run() {
      await form.submit();
      await api.resource('collections').update({
        filterByTk: name,
        values: { ...omit(form.values, ['fields']) },
      });
      ctx.setVisible(false);
      message.success(t('Saved successfully'));
      await form.reset();
      positionTargetNode();
      refreshCM();
    },
  };
};

const useDestroyAction = (name) => {
  const api = useAPIClient();
  return {
    async run() {
      await api.resource('collections').destroy({
        filterByTk: name,
      });
     await api.resource('graphPositions').destroy({
      filter: { collectionName: name }
    });
    },
  };
};

export const useDestroyActionAndRefreshCM = (props) => {
  const { name } = props;
  const { run } = useDestroyAction(name);
  const { refreshCM } = useCollectionManager();

  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

const useDestroyFieldAction = (collectionName, name) => {
  const api = useAPIClient();
  const { positionTargetNode } = useContext(GraphCollectionContext);

  return {
    async run() {
      await api.resource('collections.fields', collectionName).destroy({
        filterByTk: name,
      });
      positionTargetNode();
    },
  };
};

export const useDestroyFieldActionAndRefreshCM = (props) => {
  const { collectionName, name } = props;
  const { refreshCM } = useCollectionManager();
  const { run } = useDestroyFieldAction(collectionName, name);
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

export const useAsyncDataSource = (service: any) => (field: any) => {
  field.loading = true;
  service(field).then(
    action.bound((data: any) => {
      field.dataSource = data;
      field.loading = false;
    }),
  );
};

const useSaveGraphPositionAction = async (data) => {
  const options = {
    resource: 'graphPositions',
    action: 'create',
    data: { values: data },
  };
  await useRequest(options);
};
