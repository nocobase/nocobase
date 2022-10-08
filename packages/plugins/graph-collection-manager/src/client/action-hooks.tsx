import { useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import omit from 'lodash/omit';
import { message } from 'antd';
import { useForm } from '@formily/react';
import {
  useActionContext,
  useRequest,
  useAPIClient,
} from '@nocobase/client';
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

export const useUpdateFieldAction = ({ collectionName, name }) => {
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const api = useAPIClient();
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
    },
  };
};

export const useUpdateCollectionActionAndRefreshCM = () => {
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useContext(GraphCollectionContext);
  const { name } = form.values;
  const api = useAPIClient();

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
      refresh();
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
    },
  };
};

export const useDestroyActionAndRefreshCM = (props) => {
  const { graph, name, id } = props;
  const { run } = useDestroyAction(name);
  return {
    async run() {
      await run();
      graph.removeNode(id);
    },
  };
};

const useDestroyFieldAction = (collectionName, name) => {
  const api = useAPIClient();
  return {
    async run() {
      await api.resource('collections.fields', collectionName).destroy({
        filterByTk: name,
      });
    },
  };
};

export const useDestroyFieldActionAndRefreshCM = (props) => {
  const { collection, name } = props;
  const { run } = useDestroyFieldAction(collection, name);
  const { refresh } = useContext(GraphCollectionContext);

  return {
    async run() {
      await run();
      refresh();
    },
  };
};
