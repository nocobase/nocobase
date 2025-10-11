/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FormProvider, Schema } from '@formily/react';
import { uid } from '@formily/shared';
import _ from 'lodash';
import React, { useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponentContext } from '../context';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentOptions, useSchemaOptionsContext } from './SchemaComponentOptions';
import { useApp } from '../../application';

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
  const ctx = useContext(SchemaComponentContext);
  const ctxOptions = useSchemaOptionsContext();
  const [formId, setFormId] = useState(() => uid());
  const form = useMemo(() => props.form || createForm(), [formId]);
  const { t } = useTranslation();
  const app = useApp();

  const scope = useMemo(() => {
    return { ...props.scope, t, randomString };
  }, [props.scope, t, ctxOptions?.scope]);

  const [active, setActive] = useState(designable);

  const designableValue = useMemo(() => {
    return typeof designable === 'boolean' ? designable : active;
  }, [designable, active, ctx.designable]);

  const setDesignable = useMemo(() => {
    return (value) => {
      if (typeof designableValue !== 'boolean') {
        setActive(value);
      }
      onDesignableChange?.(value);
    };
  }, [designableValue, onDesignableChange]);

  // 初始化时同步 flowSettings 状态
  useEffect(() => {
    designableValue ? app.flowEngine?.flowSettings?.enable() : app.flowEngine?.flowSettings?.disable();
  }, [app, designableValue]);

  const reset = useCallback(() => {
    setFormId(uid());
  }, []);

  const value = useMemo(
    () => ({
      scope,
      components,
      reset,
      /**
       * @deprecated
       */
      refresh: _.noop,
      designable: designableValue,
      setDesignable,
    }),
    [components, designableValue, reset, scope, setDesignable],
  );

  return (
    <SchemaComponentContext.Provider value={value}>
      <FormProvider form={form}>
        <SchemaComponentOptions inherit scope={scope} components={components}>
          {children}
        </SchemaComponentOptions>
      </FormProvider>
    </SchemaComponentContext.Provider>
  );
};
SchemaComponentProvider.displayName = 'SchemaComponentProvider';
