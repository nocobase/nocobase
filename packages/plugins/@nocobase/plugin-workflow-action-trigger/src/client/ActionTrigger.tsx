import { useForm } from '@formily/react';

import {
  SchemaInitializerItemType,
  useCollectionDataSource,
  useCollectionManager_deprecated,
  useCompile,
} from '@nocobase/client';
import {
  Trigger,
  CollectionBlockInitializer,
  getCollectionFieldOptions,
  useWorkflowAnyExecuted,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE, useLang } from '../locale';

export default class extends Trigger {
  title = `{{t("Action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Triggers after specific operations on data are submitted, such as create, update, delete, etc., or directly submitting a record to the workflow.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    collection: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
      title: `{{t("Collection", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Which collection record belongs to.", { ns: "${NAMESPACE}" })}}`,
      'x-reactions': [
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
      type: 'array',
      title: `{{t("Associations to use", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.", { ns: "workflow" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'AppendsTreeSelect',
      'x-component-props': {
        title: 'Preload associations',
        multiple: true,
        useCollection() {
          const { values } = useForm();
          return values?.collection;
        },
      },
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              visible: '{{!!$deps[0]}}',
            },
          },
        },
      ],
    },
  };
  scope = {
    useCollectionDataSource,
    useWorkflowAnyExecuted,
  };
  isActionTriggerable = (config, context) => {
    return ['create', 'update', 'customize:update', 'customize:triggerWorkflows'].includes(context.action);
  };
  useVariables(config, options) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const compile = useCompile();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getCollectionFields } = useCollectionManager_deprecated();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langTriggerData = useLang('Trigger data');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langUserSubmittedForm = useLang('User submitted action');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langRoleSubmittedForm = useLang('Role of user submitted action');
    const rootFields = [
      {
        collectionName: config.collection,
        name: 'data',
        type: 'hasOne',
        target: config.collection,
        uiSchema: {
          title: langTriggerData,
        },
      },
      {
        collectionName: 'users',
        name: 'user',
        type: 'hasOne',
        target: 'users',
        uiSchema: {
          title: langUserSubmittedForm,
        },
      },
      {
        name: 'roleName',
        uiSchema: {
          title: langRoleSubmittedForm,
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
  }
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
      dataPath: '$context.data',
    };
  }
}
