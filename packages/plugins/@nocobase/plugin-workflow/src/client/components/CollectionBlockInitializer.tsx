import React from 'react';
import { uid } from '@formily/shared';

import {
  CollectionProvider_deprecated,
  SchemaInitializerItem,
  SchemaInitializerItemType,
  parseCollectionName,
  useCollectionManager_deprecated,
  useRecordCollectionDataSourceItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaTemplateManager,
} from '@nocobase/client';

import { traverseSchema } from '../utils';

function InnerCollectionBlockInitializer({ collection, dataPath, ...props }) {
  const { insert } = useSchemaInitializer();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager_deprecated();
  const items = useRecordCollectionDataSourceItems('FormItem') as SchemaInitializerItemType[];
  let resolvedCollection;
  if (typeof collection === 'string') {
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    resolvedCollection = getCollection(collectionName, dataSourceName);
  } else {
    resolvedCollection = collection;
  }

  async function onConfirm({ item }) {
    const template = item.template ? await getTemplateSchemaByMode(item) : null;
    const result = {
      type: 'void',
      name: uid(),
      title: resolvedCollection.title,
      'x-decorator': 'DetailsBlockProvider',
      'x-decorator-props': {
        collection,
        dataPath,
      },
      'x-component': 'CardItem',
      'x-component-props': {
        title: props.title,
      },
      'x-designer': 'SimpleDesigner',
      properties: {
        grid: {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {
            useProps: '{{useDetailsBlockProps}}',
          },
          'x-read-pretty': true,
          properties: {
            grid: template || {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'details:configureFields',
              properties: {},
            },
          },
        },
      },
    };
    traverseSchema(result, (node) => {
      if (node['x-uid']) {
        delete node['x-uid'];
      }
    });
    insert(result);
  }

  return <SchemaInitializerItem {...props} onClick={onConfirm} items={items} />;
}

export function CollectionBlockInitializer(props) {
  const itemConfig = useSchemaInitializerItem();
  const sourceCollection = props?.collection ?? itemConfig.collection;
  let dataSource, collection;
  if (typeof sourceCollection === 'string') {
    const parsed = parseCollectionName(sourceCollection);
    dataSource = parsed[0];
    collection = parsed[1];
  } else {
    collection = sourceCollection;
  }
  return (
    <CollectionProvider_deprecated dataSource={dataSource} collection={collection}>
      <InnerCollectionBlockInitializer {...itemConfig} {...props} />
    </CollectionProvider_deprecated>
  );
}
