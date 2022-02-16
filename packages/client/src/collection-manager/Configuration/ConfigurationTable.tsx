import { useForm } from '@formily/react';
import React from 'react';
import { useResourceActionContext, useResourceContext } from '..';
import { useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { SchemaComponent, useActionContext } from '../../schema-component';
import { collectionSchema } from './schemas/collections';

const useCancelAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      ctx.setVisible(false);
      form.reset();
    },
  };
};

const useCreateAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      await resource.create({ values: form.values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

const useUpdateAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({ filterByTk, values: form.values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

const useDestroyAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await resource.destroy({ filterByTk });
      refresh();
    },
  };
};

const useValues = (options) => {
  const record = useRecord();
  return useRequest(() => Promise.resolve({ data: record }), {
    ...options,
    refreshDeps: [record],
  });
};

export const ConfigurationTable = () => {
  return (
    <div>
      <SchemaComponent
        schema={collectionSchema}
        scope={{ useCancelAction, useCreateAction, useUpdateAction, useDestroyAction, useValues }}
      />
    </div>
  );
};
