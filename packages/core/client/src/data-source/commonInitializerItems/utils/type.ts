import { ISchema, Schema } from "@formily/json-schema";

import { CollectionFieldContext } from './useCollectionFieldContext';
import { CollectionFieldInterface } from "../../collection-field-interface";
import { Collection, CollectionFieldOptions } from "../../collection/Collection";

export interface CollectionFieldDefaultSchema {
  /**
   * @default 'string'
   */
  type: string;
  /**
   * @default collectionField.name
   */
  name: string;
  /**
   * @default 'CollectionField'
   */
  'x-component': string;
  /**
   * @default `${collection.name}.${collectionField.name}`
   */
  'x-collection-field': string;
  /**
   * @default collectionField?.uiSchema?.['x-read-pretty']
   */
  'x-read-pretty'?: boolean;

  /**
   * @default collectionField?.uiSchema?.title || collectionField.name
   */
  title: string;
}

export interface CollectionFieldGetSchemaResult {
  'x-toolbar'?: string;
  'x-toolbar-props'?: any;
  'x-settings'?: string;
  'x-decorator'?: string;
  'x-decorator-props'?: any;
  'x-component-props'?: any;
  'x-use-component-props'?: string;
}

export interface CollectionFieldDefaultInitializerItem {
  /**
   * @default 'item'
   */
  type: string;
  /**
   * @default collectionField.name
   */
  name: string;
  /**
   * @default collectionField?.uiSchema?.title || collectionField.name
   */
  title: string;
  /**
   * @default 'CollectionFieldInitializer'
   */
  Component: string;
  schemaInitialize: (s: ISchema) => void;
  /**
   * @default schema
   */
  schema: ISchema;
}

export interface CollectionFieldGetInitializerItemResult {
  find?: (schema: Schema, key: string, action: string) => Schema;
  remove?: (schema: Schema, cb: (schema: Schema, stopProps: Record<string, any>) => void) => void
}

export interface CommonCollectionFieldsProps {
  /**
   * block name.
   *
   * @example 'Form'、`Table`
   */
  block: string;
  getSchema: (collectionField: CollectionFieldOptions, options: CollectionFieldContext & {
    defaultSchema: CollectionFieldDefaultSchema
    targetCollection?: Collection
    collectionFieldInterface?: CollectionFieldInterface
  }) => CollectionFieldGetSchemaResult;
  isReadPretty?: (options: CollectionFieldContext) => boolean;
  filter?: (collectionField: CollectionFieldOptions, options: CollectionFieldContext) => boolean;
  getInitializerItem?: (collectionField: CollectionFieldOptions, options: CollectionFieldContext & {
    schema: ISchema;
    defaultInitializerItem: CollectionFieldDefaultInitializerItem;
    targetCollection?: Collection
    collectionFieldInterface?: CollectionFieldInterface
  }) => CollectionFieldGetInitializerItemResult;
}

export interface CollectionFieldsProps extends CommonCollectionFieldsProps {
  /**
   * show parent collection fields
   *
   * @default true
   */
  showParentCollectionFields?: boolean

  /**
   * show association fields
   * @default true
   */
  showAssociationFields?: boolean;
}

export interface CollectionFieldsItemProps extends CommonCollectionFieldsProps {
  context: Required<CollectionFieldContext>;
}
