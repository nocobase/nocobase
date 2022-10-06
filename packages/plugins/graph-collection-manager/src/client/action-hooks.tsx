import { useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import omit from 'lodash/omit';
import { message } from 'antd';
import { useForm } from '@formily/react';
import {
  useActionContext,
  useRequest,
  useCollectionManager,
  APIClient,
  useResourceActionContext,
  useResourceContext,
  useRecord,
} from '@nocobase/client';
import { GraphCollectionContext } from './components/CollectionNodeProvder';

const api = new APIClient();

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

export const useUpdateCollectionActionAndRefreshCM = () => {
  const { t } = useTranslation();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useContext(GraphCollectionContext);
  const { name } = form.values;
  return {
    async run() {
      await form.submit();
      await api.request({
        url: `/api/collections:update?filterByTk=${name}`,
        method: 'post',
        data: {
          filterByTk: name,
          ...omit(form.values, ['fields']),
        },
      });
      ctx.setVisible(false);
      message.success(t('Saved successfully'));
      await form.reset();
      refresh();
    },
  };
};

const useDestroyAction = (name) => {
  return {
    async run() {
      await api.request({
        url: `/api/collections:destroy?filterByTk=${name}`,
        method: 'post',
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
