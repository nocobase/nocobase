import React, { useContext, useRef, useEffect } from 'react';
import { Schema, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import { SchemaComponentContext } from './context';

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
  const { designable, refresh } = useContext(SchemaComponentContext);
  const DesignableBar = () => {
    return <></>;
  };
  return { designable, refresh, DesignableBar };
}
