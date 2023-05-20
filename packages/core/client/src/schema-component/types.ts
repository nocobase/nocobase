import type { Form } from '@formily/core';
import type { IRecursionFieldProps, ISchemaFieldProps, SchemaReactComponents } from '@formily/react';
import type React from 'react';

export interface ISchemaComponentContext {
  scope?: any;
  components?: SchemaReactComponents;
  refresh?: () => void;
  reset?: () => void;
  designable?: boolean;
  setDesignable?: (value: boolean) => void;
  SchemaField?: React.FC<ISchemaFieldProps>;
}

export interface ISchemaComponentProvider {
  designable?: boolean;
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
}

export interface IRecursionComponentProps extends IRecursionFieldProps {
  scope?: any;
  components?: SchemaReactComponents;
}

export interface ISchemaComponentOptionsProps {
  scope?: any;
  components?: SchemaReactComponents;
  inherit?: boolean;
}
