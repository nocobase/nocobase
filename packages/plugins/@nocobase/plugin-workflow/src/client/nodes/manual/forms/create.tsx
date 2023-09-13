import React from 'react';
import { useFieldSchema } from '@formily/react';

import { GeneralSchemaDesigner, SchemaSettings, useCollection, useCollectionManager } from '@nocobase/client';

import { NAMESPACE } from '../../../locale';
import { findSchema } from '../utils';
import { ManualFormType } from '../SchemaConfig';
import { FormBlockInitializer } from '../FormBlockInitializer';

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
    useInitializer() {
      const { collections } = useCollectionManager();
      return {
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
        children: collections
          .filter((item) => !item.hidden)
          .map((item) => ({
            key: `createForm-${item.name}`,
            type: 'item',
            title: item.title,
            schema: {
              collection: item.name,
              title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
              formType: 'create',
              'x-designer': 'CreateFormDesigner',
            },
            component: FormBlockInitializer,
          })),
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
