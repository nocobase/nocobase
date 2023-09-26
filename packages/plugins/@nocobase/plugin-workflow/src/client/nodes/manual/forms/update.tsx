import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection,
  useCollectionFilterOptions,
  useDesignable,
} from '@nocobase/client';

import { FilterDynamicComponent } from '../../../components/FilterDynamicComponent';
import { NAMESPACE } from '../../../locale';
import { FormBlockInitializer } from '../FormBlockInitializer';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

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

export default {
  title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer({ collections }) {
      return {
        key: 'updateRecordForm',
        type: 'subMenu',
        title: `{{t("Update record form", { ns: "${NAMESPACE}" })}}`,
        children: [
          {
            key: 'updateRecordForm-child',
            type: 'itemGroup',
            style: {
              maxHeight: '48vh',
              overflowY: 'auto',
            },
            loadChildren: ({ searchValue }) => {
              return collections
                .filter((item) => !item.hidden && item.title.toLowerCase().includes(searchValue.toLowerCase()))
                .map((item) => ({
                  key: `updateRecordForm-child-${item.name}`,
                  type: 'item',
                  title: item.title,
                  schema: {
                    collection: item.name,
                    title: `{{t("Update record", { ns: "${NAMESPACE}" })}}`,
                    formType: 'update',
                    'x-designer': 'UpdateFormDesigner',
                  },
                  component: FormBlockInitializer,
                }));
            },
          },
        ],
      };
    },
    initializers: {
      // AddCustomFormField
    },
    components: {
      FilterDynamicComponent,
      UpdateFormDesigner,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(
        root,
        (item) => item['x-decorator'] === 'FormBlockProvider' && item['x-decorator-props'].formType === 'update',
      );
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          ...formBlock['x-decorator-props'],
          type: 'update',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
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
    components: {},
  },
} as ManualFormType;
