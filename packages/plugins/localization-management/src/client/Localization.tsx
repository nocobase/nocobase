import {
  Input,
  SchemaComponent,
  useAPIClient,
  useAppLangContext,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Card, message } from 'antd';
import React from 'react';
import { useLocalTranslation } from './locale';
import { localizationSchema } from './schemas/localization';

const useModules = () => {
  const appLang = useAppLangContext();
  const resourceModuels = Object.keys(appLang?.resources || {}).map((module) => `resources.${module}`);
  return ['antd', 'cron', 'cronstrue', ...resourceModuels].map((module) => ({
    label: module,
    value: module,
  }));
};

const useDestroyTranslationAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { translationId: id } = useRecord();
  return {
    async run() {
      await resource.destroyTranslation({ values: { id } });
      refresh();
    },
  };
};

const useDestroyTextAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { id } = useRecord();
  return {
    async run() {
      await resource.destroyText({ values: { id } });
      refresh();
    },
  };
};

const useBulkDestroyTranslationAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  const { t } = useLocalTranslation();
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await resource.destroyTranslation({
        values: {
          id: state?.selectedRowKeys || [],
        },
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

const useHasTranslation = () => {
  const { translationId } = useRecord();
  // return !!translationId;
  return true;
};

export const Localization = () => {
  const { t } = useLocalTranslation();
  const api = useAPIClient();
  const locale = api.auth.getLocale();

  const TranslationField = (props) => (props.value ? <Input.TextArea {...props} /> : <div>{t('No data')}</div>);
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={localizationSchema}
        components={{ TranslationField }}
        scope={{
          t,
          useModules,
          useDestroyTranslationAction,
          useDestroyTextAction,
          useHasTranslation,
          useBulkDestroyTranslationAction,
        }}
      />
    </Card>
  );
};
