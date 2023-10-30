import React from 'react';

import {
  CollectionProvider,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  createFormBlockSchema,
  useRecordCollectionDataSourceItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaTemplateManager,
} from '@nocobase/client';

import { traverseSchema } from './utils';

import { JOB_STATUS } from '../../constants';
import { NAMESPACE } from '../../locale';

function InternalFormBlockInitializer({ schema, ...others }) {
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { insert } = useSchemaInitializer();
  const items = useRecordCollectionDataSourceItems('FormItem') as SchemaInitializerItemType[];
  async function onConfirm({ item }) {
    const template = item.template ? await getTemplateSchemaByMode(item) : null;
    const result = createFormBlockSchema({
      actionInitializers: 'AddActionButton',
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
          'x-designer': 'ManualActionDesigner',
          'x-designer-props': {},
        },
      },
      ...schema,
      template,
    });
    delete result['x-acl-action-props'];
    delete result['x-acl-action'];
    const [formKey] = Object.keys(result.properties);
    result.properties[formKey].properties.actions['x-decorator'] = 'ActionBarProvider';
    result.properties[formKey].properties.actions['x-component-props'].style = {
      marginTop: '1.5em',
      flexWrap: 'wrap',
    };
    traverseSchema(result, (node) => {
      if (node['x-uid']) {
        delete node['x-uid'];
      }
    });
    insert(result);
  }

  return <SchemaInitializerItem {...others} onClick={onConfirm} items={items} />;
}

export function FormBlockInitializer() {
  const itemConfig = useSchemaInitializerItem();
  return (
    <CollectionProvider collection={itemConfig.schema?.collection}>
      <InternalFormBlockInitializer {...itemConfig} />
    </CollectionProvider>
  );
}
