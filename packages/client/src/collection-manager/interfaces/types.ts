import { ISchema } from '@formily/react';

interface IDefault {
  type: string;
  uiSchema?: ISchema;
  [key: string]: any;
}

export interface IField extends ISchema {
  default?: IDefault;
  [key: string]: any;
}
