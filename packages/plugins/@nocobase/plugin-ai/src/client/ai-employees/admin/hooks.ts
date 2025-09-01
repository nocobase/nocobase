/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { App } from 'antd';
import {
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useDestroyActionProps,
} from '@nocobase/client';
import { useT } from '../../locale';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';

export const useCreateFormProps = () => {
  const t = useT();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          username: `${uid()}`,
          enableKnowledgeBase: false,
          knowledgeBase: {
            knowledgeBaseIds: [],
            topK: 3,
            score: '0.6',
          },
          knowledgeBasePrompt: t('knowledge Base Prompt default'),
        },
      }),
    [t],
  );
  return {
    form,
  };
};

export const useEditFormProps = () => {
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

export const useCancelActionProps = () => {
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

export const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const { refresh } = useDataBlockRequest();
  const { refresh: refreshAIEmployees } = useAIEmployeesData();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await api.resource('aiEmployees').create({
        values,
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
      refreshAIEmployees();
    },
  };
};

export const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const { refresh: refreshAIEmployees } = useAIEmployeesData();
  const collection = useCollection();
  const filterTk = collection.getFilterTargetKey();
  const t = useT();

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
      refreshAIEmployees();
    },
  };
};

export const useDeleteActionProps = () => {
  const t = useT();
  const record = useCollectionRecordData();
  const { onClick } = useDestroyActionProps();
  const isBuiltIn = record?.builtIn;
  const { message } = App.useApp();
  return {
    async onClick(e?, callBack?) {
      if (isBuiltIn) {
        message.warning(t('Cannot delete built-in ai employees'));
        return;
      }
      await onClick(e, callBack);
    },
  };
};
