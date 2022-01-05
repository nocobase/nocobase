import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm, Form } from '@formily/core';
import { useCookieState, useUpdateEffect } from 'ahooks';
import { useTranslation } from 'react-i18next';
import {
  Schema,
  FormProvider,
  RecursionField,
  createSchemaField,
  IRecursionFieldProps,
  ISchemaFieldProps,
  SchemaOptionsContext,
  SchemaReactComponents,
  SchemaExpressionScopeContext,
} from '@formily/react';
import { IRecursionComponentProps, ISchemaComponentProvider } from '../types';
import { SchemaComponentContext } from '../context';

export const RecursionComponent: React.FC<IRecursionComponentProps> = (props) => {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        scope: { ...props.scope, ...scope },
        components: { ...props.components, ...components },
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ scope }}>
        <RecursionField {...props} />
      </SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};
