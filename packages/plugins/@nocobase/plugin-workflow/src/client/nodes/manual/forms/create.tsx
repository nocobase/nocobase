import React from 'react';

import { GeneralSchemaDesigner, SchemaSettings, useCollection } from '@nocobase/client';

import { NAMESPACE } from '../../../locale';
import { FormBlockInitializer } from '../FormBlockInitializer';
import { ManualFormType } from '../SchemaConfig';
import { findSchema } from '../utils';

function CreateFormDesigner() {
  const { name, title } = useCollection();

  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.LinkageRules collectionName={name} />
      <SchemaSettings.DataTemplates collectionName={name} />
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
  title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer({ collections }) {
      return {
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
        children: [
          {
            key: 'createRecordForm-child',
            type: 'itemGroup',
            style: {
              maxHeight: '48vh',
              overflowY: 'auto',
            },
            loadChildren: ({ searchValue }) => {
              return collections
                .filter((item) => !item.hidden && item.title.toLowerCase().includes(searchValue.toLowerCase()))
                .map((item) => ({
                  key: `createRecordForm-child-${item.name}`,
                  type: 'item',
                  title: item.title,
                  schema: {
                    collection: item.name,
                    title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
                    formType: 'create',
                    'x-designer': 'CreateFormDesigner',
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
      CreateFormDesigner,
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(
        root,
        (item) => item['x-decorator'] === 'FormBlockProvider' && item['x-decorator-props'].formType === 'create',
      );
      formBlocks.forEach((formBlock) => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          type: 'create',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, (item) => item['x-component'] === 'Action').map(
            (item) => ({
              status: item['x-decorator-props'].value,
              values: item['x-action-settings']?.assignedValues?.values,
              key: item.name,
            }),
          ),
          collection: formBlock['x-decorator-props'].collection,
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
