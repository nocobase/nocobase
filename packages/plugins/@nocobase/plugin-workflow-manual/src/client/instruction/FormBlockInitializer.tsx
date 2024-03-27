import React from 'react';

import {
  CollectionProvider_deprecated,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  useRecordCollectionDataSourceItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaTemplateManager,
} from '@nocobase/client';

import { JOB_STATUS, traverseSchema } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../../locale';
import { createManualFormBlockUISchema } from './createManualFormBlockUISchema';

function InternalFormBlockInitializer({ schema, ...others }) {
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { insert } = useSchemaInitializer();
  const items = useRecordCollectionDataSourceItems('FormItem') as SchemaInitializerItemType[];
  async function onConfirm({ item }) {
    const template = item.template ? await getTemplateSchemaByMode(item) : null;
    const result = createManualFormBlockUISchema({
      actionInitializers: 'workflowManual:form:configureActions',
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
    //获取actionBar的schemakey
    const actionKey =
      Object.entries(result.properties[formKey].properties).find(([key, f]) => f['x-component'] === 'ActionBar')?.[0] ||
      'actions';
    result.properties[formKey].properties[actionKey]['x-decorator'] = 'ActionBarProvider';
    result.properties[formKey].properties[actionKey]['x-component-props'].style = {
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
    <CollectionProvider_deprecated
      dataSource={itemConfig.schema?.dataSource}
      collection={itemConfig.schema?.collection}
    >
      <InternalFormBlockInitializer {...itemConfig} />
    </CollectionProvider_deprecated>
  );
}
