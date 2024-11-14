/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GeneralField } from '@formily/core';
import {
  ArrayField,
  Field,
  IRecursionFieldProps,
  ISchema,
  ObjectField,
  ReactFC,
  Schema,
  SchemaContext,
  useExpressionScope,
  useField,
  VoidField,
} from '@formily/react';
import { isBool, isFn, isValid, merge } from '@formily/shared';
import _ from 'lodash';
import React, { FC, Fragment, useMemo } from 'react';
import { CollectionFieldOptions } from '../data-source/collection/Collection';
import { useCollectionManager } from '../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../data-source/collection/CollectionProvider';
import { NocoBaseField } from './NocoBaseField';

interface INocoBaseRecursionFieldProps extends IRecursionFieldProps {
  /**
   * Default Schema for collection fields
   */
  uiSchema?: ISchema;

  /**
   * Value for fields
   */
  values?: Record<string, any>;

  /**
   * @default true
   * Whether to use Formily Field class - performance will be reduced but provides better compatibility with Formily
   */
  isUseFormilyField?: boolean;
}

const CollectionFieldUISchemaContext = React.createContext<CollectionFieldOptions>({});

/**
 * @internal
 * The difference from `useCollectionField` is that it returns empty if the current schema is not a collection field,
 * while the value of `useCollectionField` is determined by the context in the component tree.
 */
export const useCollectionFieldUISchema = () => {
  return React.useContext(CollectionFieldUISchemaContext);
};

const CollectionFieldUISchemaProvider: FC<{
  fieldSchema: Schema;
}> = (props) => {
  const { children, fieldSchema } = props;
  const collection = useCollection();
  const collectionManager = useCollectionManager();
  const name = fieldSchema?.name;

  const value = useMemo(() => {
    if (!collection) return null;
    const field = fieldSchema?.['x-component-props']?.['field'];
    return (
      collectionManager.getCollectionField(fieldSchema?.['x-collection-field']) ||
      field ||
      collection.getField(field?.name || name)
    );
  }, [collection, collectionManager, fieldSchema, name]);

  return <CollectionFieldUISchemaContext.Provider value={value}>{children}</CollectionFieldUISchemaContext.Provider>;
};

const toFieldProps = _.memoize((schema: Schema, scope: any) => {
  return schema.toFieldProps({
    scope,
  }) as any;
});

const useFieldProps = (schema: Schema) => {
  const scope = useExpressionScope();
  return toFieldProps(schema, scope);
};

const useBasePath = (props: IRecursionFieldProps) => {
  const parent = useField();
  if (props.onlyRenderProperties) {
    return props.basePath || parent?.address.concat(props.name);
  }
  return props.basePath || parent?.address;
};

const createSchemaInstance = _.memoize((schema: ISchema): Schema => {
  return new Schema(schema);
});

const createMergedSchemaInstance = (schema: Schema, uiSchema: ISchema, onlyRenderProperties: boolean) => {
  const clonedSchema = schema.toJSON();

  if (onlyRenderProperties) {
    if (!clonedSchema.properties) {
      throw new Error('[NocoBaseRecursionField]: properties is required');
    }

    const firstPropertyKey = Object.keys(clonedSchema.properties)[0];
    const firstPropertyValue = Object.values(clonedSchema.properties)[0];
    // Some uiSchema's type value is "void", which can cause exceptions, so we need to ignore the type field
    clonedSchema.properties[firstPropertyKey] = merge(_.omit(uiSchema, 'type'), firstPropertyValue);
    return new Schema(clonedSchema);
  }

  // Some uiSchema's type value is "void", which can cause exceptions, so we need to ignore the type field
  return new Schema(merge(_.omit(uiSchema, 'type'), clonedSchema));
};

const propertiesToReactElement = ({
  schema,
  field,
  basePath,
  mapProperties,
  filterProperties,
  propsRecursion,
  values,
  isUseFormilyField,
}: {
  schema: Schema;
  field: any;
  basePath: any;
  mapProperties?: any;
  filterProperties?: any;
  propsRecursion?: any;
  values?: Record<string, any>;
  isUseFormilyField?: boolean;
}) => {
  const properties = Schema.getOrderProperties(schema);
  if (!properties.length) return null;
  return (
    <Fragment>
      {properties.map(({ schema: item, key: name }, index) => {
        const base = field?.address || basePath;
        let schema: Schema = item;
        if (isFn(mapProperties)) {
          const mapped = mapProperties(item, name);
          if (mapped) {
            schema = mapped;
          }
        }
        if (isFn(filterProperties)) {
          if (filterProperties(schema, name) === false) {
            return null;
          }
        }

        const content =
          isBool(propsRecursion) && propsRecursion ? (
            <NocoBaseRecursionField
              propsRecursion={true}
              filterProperties={filterProperties}
              mapProperties={mapProperties}
              schema={schema}
              name={name}
              basePath={base}
              values={_.get(values, name)}
              isUseFormilyField={isUseFormilyField}
            />
          ) : (
            <NocoBaseRecursionField
              schema={schema}
              name={name}
              basePath={base}
              values={_.get(values, name)}
              filterProperties={filterProperties}
              isUseFormilyField={isUseFormilyField}
            />
          );

        if (schema['x-component'] === 'CollectionField') {
          return (
            <IsInNocoBaseRecursionFieldContext.Provider value={true} key={`${index}-${name}`}>
              <CollectionFieldUISchemaProvider fieldSchema={schema}>{content}</CollectionFieldUISchemaProvider>
            </IsInNocoBaseRecursionFieldContext.Provider>
          );
        }

        return (
          <IsInNocoBaseRecursionFieldContext.Provider value={false} key={`${index}-${name}`}>
            <CollectionFieldUISchemaContext.Provider value={{}}>{content}</CollectionFieldUISchemaContext.Provider>
          </IsInNocoBaseRecursionFieldContext.Provider>
        );
      })}
    </Fragment>
  );
};

const IsInNocoBaseRecursionFieldContext = React.createContext(false);

/**
 * @internal
 * Note: Only suitable for use within the CollectionField component
 */
export const useIsInNocoBaseRecursionFieldContext = () => {
  return React.useContext(IsInNocoBaseRecursionFieldContext);
};

/**
 * Based on @formily/react v2.3.2 RecursionField component
 * Modified to better adapt to NocoBase's needs
 */
export const NocoBaseRecursionField: ReactFC<INocoBaseRecursionFieldProps> = React.memo((props) => {
  const {
    schema,
    name,
    onlyRenderProperties,
    onlyRenderSelf,
    mapProperties,
    filterProperties,
    propsRecursion,
    values,
    isUseFormilyField = true,
    uiSchema,
  } = props;
  const basePath = useBasePath(props);
  const fieldSchema = createSchemaInstance(schema);
  const { uiSchema: collectionFiledUiSchema } = useCollectionFieldUISchema();

  // Merge default Schema of collection fields
  const mergedFieldSchema = useMemo(() => {
    if (uiSchema) {
      return createMergedSchemaInstance(fieldSchema, uiSchema, onlyRenderProperties);
    }

    if (collectionFiledUiSchema) {
      return createMergedSchemaInstance(fieldSchema, collectionFiledUiSchema, onlyRenderProperties);
    }

    return fieldSchema;
  }, [collectionFiledUiSchema, fieldSchema, onlyRenderProperties, uiSchema]);

  const fieldProps = useFieldProps(mergedFieldSchema);

  const renderProperties = (field?: GeneralField) => {
    if (onlyRenderSelf) return;
    return propertiesToReactElement({
      schema: mergedFieldSchema,
      field,
      basePath,
      mapProperties,
      filterProperties,
      propsRecursion,
      values,
      isUseFormilyField,
    });
  };

  const render = () => {
    if (!isValid(name)) return renderProperties();
    if (mergedFieldSchema.type === 'object') {
      if (onlyRenderProperties) return renderProperties();
      return (
        <ObjectField {...fieldProps} name={name} basePath={basePath}>
          {renderProperties}
        </ObjectField>
      );
    } else if (mergedFieldSchema.type === 'array') {
      return <ArrayField {...fieldProps} name={name} basePath={basePath} />;
    } else if (mergedFieldSchema.type === 'void') {
      if (onlyRenderProperties) return renderProperties();
      return (
        <VoidField {...fieldProps} name={name} basePath={basePath}>
          {renderProperties}
        </VoidField>
      );
    }

    return isUseFormilyField ? (
      <Field {...fieldProps} name={name} basePath={basePath} />
    ) : (
      <NocoBaseField name={name} value={values} initialValue={values} basePath={basePath} schema={mergedFieldSchema} />
    );
  };

  if (!fieldSchema) return <Fragment />;

  // The original fieldSchema is still passed down to maintain compatibility with NocoBase usage.
  // fieldSchema stores some user-defined content. If we pass down mergedFieldSchema instead,
  // some default schema values would also be saved in fieldSchema.
  return <SchemaContext.Provider value={fieldSchema}>{render()}</SchemaContext.Provider>;
});

NocoBaseRecursionField.displayName = 'NocoBaseRecursionField';
