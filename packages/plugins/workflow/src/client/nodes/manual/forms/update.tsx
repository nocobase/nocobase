import React from 'react';
import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';

import {
  CollectionProvider,
  createFormBlockSchema,
  GeneralSchemaDesigner,
  RecordProvider,
  SchemaInitializer,
  SchemaSettings,
  useCollection,
  useCollectionFilterOptions,
  useCollectionManager,
  useDesignable,
  useRecord,
} from '@nocobase/client';

import { NAMESPACE } from '../../../locale';
import { JOB_STATUS } from '../../../constants';
import { findSchema, ManualFormType } from '../SchemaConfig';
import { FilterDynamicComponent } from '../../../components/FilterDynamicComponent';

function UpdateFormDesigner() {
  const { name, title } = useCollection();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.ActionModalItem
        title={t('Filter settings', { ns: NAMESPACE })}
        schema={{
          name: 'filter',
          type: 'object',
          title: `{{t("Filter")}}`,
          // 'x-decorator': 'FormItem',
          'x-component': 'Filter',
          'x-component-props': {
            useProps() {
              const options = useCollectionFilterOptions(fieldSchema?.['x-decorator-props']?.collection);
              return {
                options,
              };
            },
            dynamicComponent: 'FilterDynamicComponent',
          },
        }}
        initialValues={fieldSchema?.['x-decorator-props']}
        onSubmit={({ filter }) => {
          fieldSchema['x-decorator-props'].filter = filter;
          dn.emit('patch', {
            schema: {
              // ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.LinkageRules collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
}

function UpdateFormBlockProvider({ collection, children }) {
  const record = useRecord() ?? {};

  return (
    <CollectionProvider collection={collection}>
      <RecordProvider record={record}>{children}</RecordProvider>
    </CollectionProvider>
  );
}

function UpdateFormBlockInitializer({ insert, collection, ...props }) {
  function onConfirm() {
    const schema = createFormBlockSchema({
      title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
      collection,
      actionInitializers: 'AddActionButton',
      action: 'get',
      actions: {
        resolve: {
          type: 'void',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'ManualActionStatusProvider',
          'x-decorator-props': {
            value: JOB_STATUS.RESOLVED,
          },
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            useAction: '{{ useSubmit }}',
          },
          'x-designer': 'Action.Designer',
          'x-action': `${JOB_STATUS.RESOLVED}`,
        },
      },
    });
    Object.assign(schema, {
      'x-decorator': 'UpdateFormBlockProvider',
      'x-decorator-props': { collection },
      'x-designer': 'UpdateFormDesigner',
    });

    insert(schema);
  }

  return <SchemaInitializer.Item {...props} onClick={onConfirm} />;
}

export default {
  title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer() {
      const { collections } = useCollectionManager();
      return {
        key: 'updateRecordForm',
        type: 'subMenu',
        title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
        children: collections.map((item) => ({
          key: item.name,
          type: 'item',
          title: item.title,
          collection: item.name,
          component: UpdateFormBlockInitializer,
        })),
      };
    },
    initializers: {
      // AddCustomFormField
    },
    components: {
      UpdateFormBlockProvider,
      FilterDynamicComponent,
      UpdateFormDesigner,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(root, (item) => item['x-decorator'] === 'UpdateFormBlockProvider');
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          ...formBlock['x-decorator-props'],
          type: 'update',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => item['x-decorator-props'].value,
          ),
        };
      });
      return forms;
    },
  },
  block: {
    scope: {
      // useFormBlockProps
    },
    components: {
      UpdateFormBlockProvider,
    },
  },
} as ManualFormType;
