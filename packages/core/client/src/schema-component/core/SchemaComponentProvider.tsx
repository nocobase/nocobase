import { createForm } from '@formily/core';
import { FormProvider, Schema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponentContextProvider } from '../context';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentOptions } from './SchemaComponentOptions';

const randomString = (prefix = '') => {
  return `${prefix}${uid()}`;
};

Schema.silent(true);

const results = {};

const Registry = {
  silent: true,
  compile(expression: string, scope = {}) {
    const fn = () => {
      if (Registry.silent) {
        try {
          return new Function('$root', `with($root) { return (${expression}); }`)(scope);
        } catch {
          return `{{${expression}}}`;
        }
      } else {
        return new Function('$root', `with($root) { return (${expression}); }`)(scope);
      }
    };
    if (results[expression]) {
      return results[expression];
    }
    if (expression.trim().startsWith('t(')) {
      results[expression] = fn();
      return results[expression];
    }
    return fn();
  },
};

Schema.registerCompiler(Registry.compile);

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  const { designable, onDesignableChange, components, children } = props;
  const [uidValue, setUid] = useState(uid());
  const [formId, setFormId] = useState(uid());
  const form = useMemo(() => props.form || createForm(), [formId]);
  const { t } = useTranslation();
  const scope = useMemo(() => {
    return { ...props.scope, t, randomString };
  }, [props.scope, t]);
  const [active, setActive] = useState(designable);

  const refresh = useCallback(() => {
    setUid(uid());
  }, []);

  const reset = useCallback(() => {
    setFormId(uid());
  }, []);
  const setDesignable = useCallback(
    (value) => {
      if (typeof designable !== 'boolean') {
        setActive(value);
      }
      onDesignableChange?.(value);
    },
    [designable, onDesignableChange],
  );

  const contextValue = useMemo(() => {
    return {
      scope,
      components,
      reset,
      refresh,
      designable: typeof designable === 'boolean' ? designable : active,
      setDesignable,
    };

    // uidValue 虽然没用到，但是这里必须加上，为了让整个页面能够渲染
  }, [uidValue, scope, components, reset, refresh, designable, active, setDesignable]);

  return (
    <SchemaComponentContextProvider value={contextValue}>
      <FormProvider form={form}>
        <SchemaComponentOptions inherit scope={scope} components={components}>
          {children}
        </SchemaComponentOptions>
      </FormProvider>
    </SchemaComponentContextProvider>
  );
};
SchemaComponentProvider.displayName = 'SchemaComponentProvider';
