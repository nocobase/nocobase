import React, { useContext, useRef, useEffect } from 'react';
import {
  ISchema,
  Schema,
  SchemaExpressionScopeContext,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { SchemaComponentContext } from './context';
import { merge } from '@formily/shared';
import { set } from 'lodash';

export const useFieldProps = (schema: Schema) => {
  const options = useContext(SchemaOptionsContext);
  const scope = useContext(SchemaExpressionScopeContext);
  const scopeRef = useRef<any>();
  scopeRef.current = scope;
  return schema.toFieldProps({
    ...options,
    get scope() {
      return {
        ...options.scope,
        ...scopeRef.current,
      };
    },
  }) as any;
};

interface IRecycleTarget {
  onMount: () => void;
  onUnmount: () => void;
}

export const useAttach = <T extends IRecycleTarget>(target: T): T => {
  const oldTargetRef = useRef<IRecycleTarget>(null);
  useEffect(() => {
    if (oldTargetRef.current && target !== oldTargetRef.current) {
      oldTargetRef.current.onUnmount();
    }
    oldTargetRef.current = target;
    target.onMount();
    return () => {
      target.onUnmount();
    };
  }, [target]);
  return target;
};

// TODO
export function useDesignable() {
  const { designable, refresh, refreshFormId } = useContext(SchemaComponentContext);
  const DesignableBar = () => {
    return <></>;
  };
  const field = useField();
  const fieldSchema = useFieldSchema();
  return {
    designable,
    refresh,
    refreshFormId,
    DesignableBar,
    patch: (key: ISchema | string, value?: any) => {
      const update = (obj: any) => {
        Object.keys(obj).forEach((k) => {
          const val = obj[k];
          if (k === 'title') {
            field.title = val;
            fieldSchema['title'] = val;
          }
          if (k === 'x-component-props') {
            Object.keys(val).forEach((i) => {
              field.componentProps[i] = val[i];
              fieldSchema['x-component-props'][i] = val[i];
            });
          }
        });
      };
      if (typeof key === 'string') {
        const obj = {};
        set(obj, key, value);
        return update(obj);
      }
      update(key);
      refresh();
    },
    remove() {
      fieldSchema.parent.removeProperty(fieldSchema.name);
      refresh();
    },
    append(schema: ISchema) {
      fieldSchema.addProperty(schema.name, schema);
      refresh();
    },
    prepend(schema: ISchema) {
      fieldSchema.addProperty(schema.name, schema);
      refresh();
    },
    insertBefore(schema: ISchema) {
      fieldSchema.parent.addProperty(schema.name, schema);
      refresh();
    },
    insertAfter(schema: ISchema) {
      fieldSchema.parent.addProperty(schema.name, schema);
      refresh();
    },
  };
}
