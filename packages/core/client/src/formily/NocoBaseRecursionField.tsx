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
import React, { Fragment, useMemo } from 'react';
import { CollectionFieldProvider } from '../data-source/collection-field/CollectionFieldProvider';
import { NocoBaseField } from './NocoBaseField';

interface INocoBaseRecursionFieldProps extends IRecursionFieldProps {
  /**
   * Default Schema for collection fields
   */
  uiSchema?: ISchema | ((schema: Schema) => ISchema);

  /**
   * Value for fields
   */
  values?: Record<string, any>;

  /**
   * 是否使用 Formily Filed 类，性能会有所下降，但是可以更好的兼容 Formily
   */
  isUseFormilyField?: boolean;
}

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

const toJSON = _.memoize((schema: Schema) => {
  return schema.toJSON();
});

const createMergedSchemaInstance = _.memoize((schema: Schema, uiSchema: ISchema, onlyRenderProperties: boolean) => {
  const clonedSchema = toJSON(schema);

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
});

const propertiesToReactElement = ({
  schema,
  uiSchema,
  field,
  basePath,
  mapProperties,
  filterProperties,
  propsRecursion,
  values,
  isUseFormilyField,
}: {
  schema: Schema;
  uiSchema?: ISchema | ((schema: Schema) => ISchema);
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
        if (isBool(propsRecursion) && propsRecursion) {
          return (
            <NocoBaseRecursionField
              propsRecursion={true}
              filterProperties={filterProperties}
              mapProperties={mapProperties}
              schema={schema}
              key={`${index}-${name}`}
              name={name}
              basePath={base}
              values={_.get(values, name)}
              isUseFormilyField={isUseFormilyField}
              uiSchema={isFn(uiSchema) ? uiSchema : undefined}
            />
          );
        }
        return (
          <NocoBaseRecursionField
            schema={schema}
            key={`${index}-${name}`}
            name={name}
            basePath={base}
            values={_.get(values, name)}
            filterProperties={filterProperties}
            isUseFormilyField={isUseFormilyField}
            uiSchema={isFn(uiSchema) ? uiSchema : undefined}
          />
        );
      })}
    </Fragment>
  );
};

/**
 * Based on @formily/react v2.3.2 RecursionField component
 * Modified to better adapt to NocoBase's needs
 */
export const NocoBaseRecursionField: ReactFC<INocoBaseRecursionFieldProps> = React.memo((props) => {
  const basePath = useBasePath(props);
  const fieldSchema = createSchemaInstance(props.schema);

  // Merge default Schema of collection fields
  const mergedFieldSchema = useMemo(() => {
    if (isFn(props.uiSchema)) {
      return createMergedSchemaInstance(fieldSchema, props.uiSchema(fieldSchema), props.onlyRenderProperties);
    }
    if (props.uiSchema) {
      return createMergedSchemaInstance(fieldSchema, props.uiSchema, props.onlyRenderProperties);
    }

    return fieldSchema;
  }, [fieldSchema, props.onlyRenderProperties, props.uiSchema]);

  const fieldProps = useFieldProps(mergedFieldSchema);

  const renderProperties = (field?: GeneralField) => {
    if (props.onlyRenderSelf) return;
    return propertiesToReactElement({
      schema: mergedFieldSchema,
      uiSchema: props.uiSchema,
      field,
      basePath,
      mapProperties: props.mapProperties,
      filterProperties: props.filterProperties,
      propsRecursion: props.propsRecursion,
      values: props.values,
      isUseFormilyField: props.isUseFormilyField,
    });
  };

  const render = () => {
    if (!isValid(props.name)) return renderProperties();
    if (mergedFieldSchema.type === 'object') {
      if (props.onlyRenderProperties) return renderProperties();
      return (
        <ObjectField {...fieldProps} name={props.name} basePath={basePath}>
          {renderProperties}
        </ObjectField>
      );
    } else if (mergedFieldSchema.type === 'array') {
      return <ArrayField {...fieldProps} name={props.name} basePath={basePath} />;
    } else if (mergedFieldSchema.type === 'void') {
      if (props.onlyRenderProperties) return renderProperties();
      return (
        <VoidField {...fieldProps} name={props.name} basePath={basePath}>
          {renderProperties}
        </VoidField>
      );
    }

    if (fieldSchema['x-component'] === 'CollectionField') {
      return (
        <CollectionFieldProvider name={fieldSchema.name}>
          {props.isUseFormilyField ? (
            <Field {...fieldProps} name={props.name} basePath={basePath} />
          ) : (
            <NocoBaseField
              name={props.name}
              value={props.values}
              initialValue={props.values}
              basePath={basePath}
              schema={mergedFieldSchema}
            />
          )}
        </CollectionFieldProvider>
      );
    }

    return props.isUseFormilyField ? (
      <Field {...fieldProps} name={props.name} basePath={basePath} />
    ) : (
      <NocoBaseField
        name={props.name}
        value={props.values}
        initialValue={props.values}
        basePath={basePath}
        schema={mergedFieldSchema}
      />
    );
  };

  if (!fieldSchema) return <Fragment />;

  // The original fieldSchema is still passed down to maintain compatibility with NocoBase usage.
  // fieldSchema stores some user-defined content. If we pass down mergedFieldSchema instead,
  // some default schema values would also be saved in fieldSchema.
  return <SchemaContext.Provider value={fieldSchema}>{render()}</SchemaContext.Provider>;
});

NocoBaseRecursionField.displayName = 'NocoBaseRecursionField';
