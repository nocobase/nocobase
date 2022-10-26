import { observer, useForm } from '@formily/react';
import { action } from '@formily/reactive';
import {
  useActionContext,
  useAPIClient,
  useCollectionFieldFormValues,
  useCollectionManager,
  useCompile,
  useRequest,
} from '@nocobase/client';
import { message, Select } from 'antd';
import omit from 'lodash/omit';
import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphCollectionContext } from './components/CollectionNodeProvder';
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

export const useCreateActionAndRefreshCM = (setTargetNode) => {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refreshCM } = useCollectionManager();

  return {
    async run() {
      await form.submit();
      await api.resource('collections').create({ values: form.values });
      ctx.setVisible(false);
      await form.reset();
      setTargetNode('last');
      await refreshCM();
    },
  };
};

export const useCreateAction = (collectionName, targetId) => {
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  const { refreshCM } = useCollectionManager();
  const { positionTargetNode } = useContext(GraphCollectionContext);
  const { getValues } = useCollectionFieldFormValues();

  return {
    async run() {
      await form.submit();
      const values = getValues();
      const {
        data: { data },
      } = await api.resource('collections.fields', collectionName).create({ values });
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

export const useUpdateFieldAction = ({ collectionName, name, key }) => {
  const { refreshCM } = useCollectionManager();
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
  const { positionTargetNode, node } = useContext(GraphCollectionContext);
  return {
    async run() {
      await form.submit();
      await api.resource('collections.fields', collectionName).update({
        filterByTk: name,
        values: form.values,
      });
      ctx.setVisible(false);
      message.success(t('Saved successfully'));
      positionTargetNode();
      refreshCM();
      node.setPortProp(key, 'uiSchema', { title: form.values?.uiSchema.title });
      await form.reset();
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
        filter: { collectionName: name },
      });
    },
  };
};

export const useDestroyActionAndRefreshCM = (props) => {
  const { name } = props;
  const { run } = useDestroyAction(name);
  const { refreshCM } = useCollectionManager();
  const { positionTargetNode } = useContext(GraphCollectionContext);
  return {
    async run() {
      await run();
      positionTargetNode('destory');
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
