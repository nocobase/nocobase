/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IRecursionFieldProps, ISchemaFieldProps, RecursionField, Schema } from '@formily/react';
import { useUpdate } from 'ahooks';
import React, { memo, useContext, useMemo } from 'react';
import { SchemaComponentContext } from '../context';
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

interface DistributedProps {
  /**
   * 是否和父级隔离刷新
   * @default false
   */
  distributed?: boolean;
}

const RecursionSchemaComponent = memo((props: ISchemaFieldProps & SchemaComponentOnChange & DistributedProps) => {
  const { components, scope, schema: _schema, distributed, ...others } = props;
  const ctx = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(_schema), [_schema]);
  const refresh = useUpdate();

  return (
    <SchemaComponentContext.Provider
      value={{
        ...ctx,
        distributed: ctx.distributed == false ? false : distributed,
        refresh: () => {
          refresh();
          if (ctx.distributed === false || distributed === false) {
            ctx.refresh?.();
          }
          props.onChange?.(schema);
        },
      }}
    >
      <SchemaComponentOptions inherit components={components} scope={scope}>
        <RecursionField {...others} schema={schema} />
      </SchemaComponentOptions>
    </SchemaComponentContext.Provider>
  );
});

const MemoizedSchemaComponent = memo((props: ISchemaFieldProps & SchemaComponentOnChange & DistributedProps) => {
  const { schema, ...others } = props;
  const s = useMemoizedSchema(schema);
  return <RecursionSchemaComponent {...others} schema={s} />;
});

export const SchemaComponent = memo(
  (
    props: (ISchemaFieldProps | IRecursionFieldProps) & { memoized?: boolean } & SchemaComponentOnChange &
      DistributedProps,
  ) => {
    const { memoized, ...others } = props;
    if (memoized) {
      return <MemoizedSchemaComponent {...others} />;
    }
    return <RecursionSchemaComponent {...others} />;
  },
);
