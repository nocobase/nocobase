import { useField, useFieldSchema, useForm } from '@formily/react';
import {
  SchemaInitializerItemOptions,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useCollectionDataSource,
  useCollectionManager,
  useCompile,
  useCurrentUserContext,
  useFilterByTk,
  useRecord,
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
  useInitializers(config): SchemaInitializerItemOptions | null {
    if (!config.collection) {
      return null;
    }

    return {
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      component: CollectionBlockInitializer,
      collection: config.collection,
      dataSource: '{{$context.data}}',
    };
  },
  initializers: {},
};

function getFormValues(filterByTk, field, form, fieldNames, getField, resource) {
  if (filterByTk) {
    const actionFields = field?.data?.activeFields as Set<string>;
    if (actionFields) {
      const keys = Object.keys(form.values).filter((key) => {
        const f = getField(key);
        return !actionFields.has(key) && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(f?.type);
      });
      return omit({ ...form.values }, keys);
    }
  }

  return form.values;
}

export function useTriggerWorkflowsActionProps() {
  const api = useAPIClient();
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { setVisible, fieldSchema } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField, getTreeParentField } = useCollection();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const { modal } = App.useApp();

  const currentUser = currentUserContext?.data?.data;
  const filterKeys = actionField.componentProps.filterKeys || [];

  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};
      const addChild = fieldSchema?.['x-component-props']?.addChild;
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
      // const values = omitBy(formValues, (value) => isEqual(JSON.stringify(value), '[{}]'));
      if (addChild) {
        const treeParentField = getTreeParentField();
        values[treeParentField?.name ?? 'parent'] = currentRecord;
        values[treeParentField?.foreignKey ?? 'parentId'] = currentRecord.id;
      }
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        const data = await api.resource('workflows').trigger({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
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
