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
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import 'ses';
import { SchemaComponentContext } from '../context';
import { ISchemaComponentProvider } from '../types';
import { SchemaComponentOptions, useSchemaOptionsContext } from './SchemaComponentOptions';

// setTimeout(() => {
//   lockdown({
//     legacyRegeneratorRuntimeTaming: 'unsafe-ignore',
//     // ...其他配置项
//   });
// }, 0);

const randomString = (prefix = '') => {
  return `${prefix}${uid()}`;
};

Schema.silent(true);

const results = {};

export const Registry = {
  silent: true,
  compile(expression: string, scope = {}) {
    const fn = () => {
      // 预检查表达式，直接拒绝危险模式
      const dangerousPatterns = [
        /constructor\s*\.\s*constructor/,
        /\.constructor\s*\(/,
        /\[['"]constructor['"]\]/,
        /new\s+Function\s*\(/,
        /Function\s*\(/,
        /eval\s*\(/,
      ];

      if (dangerousPatterns.some((pattern) => pattern.test(expression))) {
        return `{{${expression}}}`;
      }

      const blockedConstructor = function () {
        throw new Error('Constructor access is denied');
      };

      Object.defineProperty(blockedConstructor, 'constructor', {
        value: blockedConstructor,
        writable: false,
        enumerable: false,
        configurable: false,
      });

      const compartment = new Compartment({
        ...scope,
        Function: undefined,
        eval: undefined,
        Object: {
          ...Object,
          constructor: blockedConstructor,
        },
        Array: {
          ...Array,
          constructor: blockedConstructor,
        },
        String: {
          ...String,
          constructor: blockedConstructor,
        },
        Number: {
          ...Number,
          constructor: blockedConstructor,
        },
        constructor: blockedConstructor,
      });

      if (Registry.silent) {
        try {
          return compartment.evaluate(`(${expression})`);
        } catch {
          return `{{${expression}}}`;
        }
      } else {
        return compartment.evaluate(`(${expression})`);
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
