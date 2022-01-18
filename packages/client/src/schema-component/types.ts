import React, { createContext, useContext, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm, Form } from '@formily/core';
import { useCookieState } from 'ahooks';
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

export interface ISchemaComponentContext {
  scope?: any;
  components?: SchemaReactComponents;
  refresh?: () => void;
  refreshFormId?: () => void;
  reset?: () => void;
  designable?: boolean;
  setDesignable?: (value: boolean) => void;
  SchemaField?: React.FC<ISchemaFieldProps>;
}

export interface ISchemaComponentProvider {
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
}

export interface IRecursionComponentProps extends IRecursionFieldProps {
  scope?: any;
  components?: SchemaReactComponents;
}
