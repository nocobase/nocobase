/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from '@formily/core';
import { IRecursionFieldProps, ISchemaFieldProps, SchemaReactComponents } from '@formily/react';
import React from 'react';

export interface ISchemaComponentContext {
  scope?: any;
  components?: SchemaReactComponents;
  refresh?: (options?: { refreshParentSchema?: boolean }) => void;
  reset?: () => void;
  designable?: boolean;
  setDesignable?: (value: boolean) => void;
  SchemaField?: React.FC<ISchemaFieldProps>;
  distributed?: boolean;
  [key: string]: any;
}

export interface ISchemaComponentProvider {
  designable?: boolean;
  onDesignableChange?: (value: boolean) => void;
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
  children?: React.ReactNode;
}

export interface IRecursionComponentProps extends IRecursionFieldProps {
  scope?: any;
  components?: SchemaReactComponents;
}

export interface ISchemaComponentOptionsProps {
  scope?: any;
  components?: SchemaReactComponents;
  inherit?: boolean;
  children?: React.ReactNode;
}
