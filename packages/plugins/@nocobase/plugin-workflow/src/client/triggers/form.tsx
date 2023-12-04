import { useField, useFieldSchema, useForm } from '@formily/react';
import {
  SchemaInitializerItemType,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollectValuesToSubmit,
  useCollectionDataSource,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { isURL, parse } from '@nocobase/utils/client';
import { App, message } from 'antd';
import omit from 'lodash/omit';
import { useNavigate } from 'react-router-dom';
import { CollectionBlockInitializer } from '../components/CollectionBlockInitializer';
import { NAMESPACE, lang } from '../locale';
import { appends, collection } from '../schemas/collection';
import { getCollectionFieldOptions } from '../variable';

export default {
  title: `{{t("Form event", { ns: "${NAMESPACE}" })}}`,
  type: 'form',
  description: `{{t("Event triggers when submitted a workflow bound form action.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    collection: {
      ...collection,
      title: `{{t("Form data model", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Use a collection to match form data.", { ns: "${NAMESPACE}" })}}`,
      ['x-reactions']: [
        ...collection['x-reactions'],
        {
          target: 'appends',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
      ],
    },
    appends: {
      ...appends,
      title: `{{t("Associations to use", { ns: "${NAMESPACE}" })}}`,
    },
  },
  scope: {
    useCollectionDataSource,
  },
  components: {},
  useVariables(config, options) {
    const compile = useCompile();
    const { getCollectionFields } = useCollectionManager();
    const rootFields = [
      {
        collectionName: config.collection,
        name: 'data',
        type: 'hasOne',
        target: config.collection,
        uiSchema: {
          title: lang('Trigger data'),
        },
      },
      {
        collectionName: 'users',
        name: 'user',
        type: 'hasOne',
        target: 'users',
        uiSchema: {
          title: lang('User submitted form'),
        },
      },
    ];
    const result = getCollectionFieldOptions({
      // depth,
      appends: ['data', 'user', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...options,
      fields: rootFields,
      compile,
      getCollectionFields,
    });
    return result;
  },
  useInitializers(config): SchemaInitializerItemType | null {
    if (!config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataSource: '{{$context.data}}',
    };
  },
  initializers: {},
  useActionTriggerable: true,
};

export function useTriggerWorkflowsActionProps() {
  const api = useAPIClient();
  const form = useForm();
  const { field, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal } = App.useApp();
  const collectValues = useCollectValuesToSubmit();

  const filterKeys = actionField.componentProps.filterKeys || [];

  return {
    async onClick() {
      const { onSuccess, skipValidator, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = await collectValues();
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        const data = await api.resource('workflows').trigger({
          values,
          filterKeys: filterKeys,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        actionField.data.loading = false;
        actionField.data.data = data;
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  navigate(onSuccess.redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(onSuccess?.successMessage));
        }
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
}
