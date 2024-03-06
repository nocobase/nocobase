import { IRecursionFieldProps, ISchemaFieldProps, RecursionField, Schema } from '@formily/react';
import React, { memo, useCallback, useContext, useMemo } from 'react';
import { SchemaComponentContext, SchemaComponentContextProvider } from '../context';
import { SchemaComponentOptions } from './SchemaComponentOptions';

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

const RecursionSchemaComponent = (props: ISchemaFieldProps & SchemaComponentOnChange) => {
  const { components, scope, schema, ...others } = props;
  const ctx = useContext(SchemaComponentContext);
  const s = useMemo(() => toSchema(schema), [schema]);
  const refresh = useCallback(() => {
    ctx.refresh?.();
    props.onChange?.(s);
  }, [s, ctx.refresh, props.onChange]);

  const contextValue = useMemo(
    () => ({
      ...ctx,
      refresh,
    }),
    [ctx, refresh],
  );

  return (
    <SchemaComponentContextProvider value={contextValue}>
      <SchemaComponentOptions inherit components={components} scope={scope}>
        <RecursionField {...others} schema={s} />
      </SchemaComponentOptions>
    </SchemaComponentContextProvider>
  );
};

const MemoizedSchemaComponent = (props: ISchemaFieldProps & SchemaComponentOnChange) => {
  const { schema, ...others } = props;
  const s = useMemoizedSchema(schema);
  return <RecursionSchemaComponent {...others} schema={s} />;
};

export const SchemaComponent = memo(
  (props: (ISchemaFieldProps | IRecursionFieldProps) & { memoized?: boolean } & SchemaComponentOnChange) => {
    const { memoized, ...others } = props;
    if (memoized) {
      return <MemoizedSchemaComponent {...others} />;
    }
    return <RecursionSchemaComponent {...others} />;
  },
);

SchemaComponent.displayName = 'SchemaComponent';
