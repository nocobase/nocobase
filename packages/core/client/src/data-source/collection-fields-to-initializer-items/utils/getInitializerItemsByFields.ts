/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionFieldDefaultSchema,
  CollectionFieldDefaultInitializerItem,
  CommonCollectionFieldsProps,
} from './type';
import { CollectionFieldOptions } from '../../collection/Collection';
import { CollectionFieldContext } from './useCollectionFieldContext';
import { ISchema } from '@formily/json-schema';
import { SchemaInitializerItemType } from '../../../application/schema-initializer';

export function getInitializerItemsByFields(
  props: CommonCollectionFieldsProps,
  fields: CollectionFieldOptions[],
  context: CollectionFieldContext,
) {
  const {
    block,
    isReadPretty = ({ form }) => form.readPretty,
    filter = () => true,
    getInitializerItem = () => ({}),
    getSchema = () => ({}),
  } = props;

  const { collectionManager, collection, dataSourceManager, actionContext } = context;
  const action = actionContext.fieldSchema?.['x-action'];
  if (!collection) return [];
  return fields
    .map((collectionField) => {
      const targetCollection = collectionManager.getCollection(collectionField.target!);
      const collectionFieldInterface = dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
        collectionField.interface,
      );
      return {
        collectionField,
        context: {
          ...context,
          targetCollection,
          collectionFieldInterface,
        },
      };
    })
    .filter(({ collectionField }) => collectionField.interface)
    .filter(({ collectionField, context }) => {
      return filter(collectionField, context);
    })
    .map(({ collectionField, context }) => {
      const defaultSchema: CollectionFieldDefaultSchema = {
        type: 'string',
        title: collectionField?.uiSchema?.title || collectionField.name,
        name: collectionField.name,
        'x-component': 'CollectionField',
        'x-collection-field': `${collection.name}.${collectionField.name}`,
        'x-read-pretty': collectionField?.uiSchema?.['x-read-pretty'],
      };
      const customSchema = getSchema(collectionField, { ...context, defaultSchema: defaultSchema });
      const schema = {
        ...defaultSchema,
        ...(customSchema || {}),
      };
      return {
        collectionField,
        schema,
        context: {
          ...context,
          schema,
        },
      };
    })
    .map(({ collectionField, context }) => {
      const defaultInitializerItem = {
        type: 'item',
        name: collectionField.name,
        title: collectionField?.uiSchema?.title || collectionField.name,
        Component: 'CollectionFieldInitializer',
        schemaInitialize: (s: ISchema) => {
          context.collectionFieldInterface?.schemaInitialize?.(s, {
            field: collectionField,
            block,
            readPretty: isReadPretty?.(context),
            action,
            targetCollection: context.targetCollection,
          });
        },
        schema: context.schema,
      } as CollectionFieldDefaultInitializerItem;
      return {
        collectionField,
        context,
        defaultInitializerItem,
      };
    })
    .map(({ collectionField, defaultInitializerItem, context }) => {
      const customInitializerItem = getInitializerItem(collectionField, {
        ...context,
        defaultInitializerItem,
      });

      return {
        ...defaultInitializerItem,
        ...(customInitializerItem || {}),
      } as SchemaInitializerItemType;
    });
}
