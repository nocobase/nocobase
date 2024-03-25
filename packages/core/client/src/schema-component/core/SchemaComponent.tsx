import { IRecursionFieldProps, ISchemaFieldProps, RecursionField, Schema } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { SchemaComponentContext } from '../context';
import { SchemaComponentOptions } from './SchemaComponentOptions';
import { useUpdate } from 'ahooks';

type SchemaComponentOnChange = {
  onChange?: (s: Schema) => void;
};

function toSchema(schema?: any) {
  if (Schema.isSchemaInstance(schema)) {
    return schema;
  }
  if (schema?.name) {
    return new Schema({
      type: 'object',
      properties: {
        [schema.name]: schema,
      },
    });
  }
  return new Schema(schema);
}

const useMemoizedSchema = (schema) => {
  return useMemo(() => toSchema(schema), []);
};

interface RefreshProps {
  /**
   * 是否刷新父级
   * @default true
   */
  shouldRefreshParent?: boolean;
  /**
   * 子级是否应该刷新父级
   * @default true
   */
  childShouldRefreshParent?: boolean;
}

const RecursionSchemaComponent = (props: ISchemaFieldProps & SchemaComponentOnChange & RefreshProps) => {
  const { components, scope, schema, shouldRefreshParent = true, childShouldRefreshParent, ...others } = props;
  const ctx = useContext(SchemaComponentContext);
  const s = useMemo(() => toSchema(schema), [schema]);
  const refresh = useUpdate();

  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        shouldRefreshParent: childShouldRefreshParent || ctx.shouldRefreshParent,
        refresh: () => {
          refresh();
          if (ctx.shouldRefreshParent || shouldRefreshParent) {
            ctx.refresh?.();
          }
          props.onChange?.(s);
        },
      }}
    >
      <SchemaComponentOptions inherit components={components} scope={scope}>
        <RecursionField {...others} schema={s} />
      </SchemaComponentOptions>
    </SchemaComponentContext.Provider>
  );
};

const MemoizedSchemaComponent = (props: ISchemaFieldProps & SchemaComponentOnChange & RefreshProps) => {
  const { schema, ...others } = props;
  const s = useMemoizedSchema(schema);
  return <RecursionSchemaComponent {...others} schema={s} />;
};

export const SchemaComponent = (
  props: (ISchemaFieldProps | IRecursionFieldProps) & { memoized?: boolean } & SchemaComponentOnChange & RefreshProps,
) => {
  const { memoized, ...others } = props;
  if (memoized) {
    return <MemoizedSchemaComponent {...others} />;
  }
  return <RecursionSchemaComponent {...others} />;
};
