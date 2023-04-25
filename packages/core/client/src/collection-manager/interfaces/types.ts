import { ISchema } from '@formily/react';

interface IDefault {
  type: string;
  uiSchema?: ISchema;
  [key: string]: any;
}

export interface IField extends ISchema {
  default?: IDefault;
  operators?: any[];
  filterable?: any;
  [key: string]: any;
}
