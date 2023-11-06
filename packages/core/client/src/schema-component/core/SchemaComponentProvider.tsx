import { createForm } from '@formily/core';
import { FormProvider, Schema } from '@formily/react';
import { uid } from '@formily/shared';
import { useCookieState } from 'ahooks';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponentContext } from '../context';
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
  const { designable, components, children } = props;
  const [, setUid] = useState(uid());
  const [formId, setFormId] = useState(uid());
  const form = useMemo(() => props.form || createForm(), [formId]);
  const { t } = useTranslation();
  const scope = { ...props.scope, t, randomString };
  const [active, setActive] = useCookieState('useCookieDesignable', {
    defaultValue: designable ? 'true' : 'false',
  });
  return (
    <SchemaComponentContext.Provider
      value={{
        scope,
        components,
        reset: () => setFormId(uid()),
        refresh: () => setUid(uid()),
        designable: active === 'true',
        setDesignable(value) {
          setActive(value ? 'true' : 'false');
        },
      }}
    >
      <FormProvider form={form}>
        <SchemaComponentOptions inherit scope={scope} components={components}>
          {children}
        </SchemaComponentOptions>
      </FormProvider>
    </SchemaComponentContext.Provider>
  );
};
SchemaComponentProvider.displayName = 'SchemaComponentProvider';
