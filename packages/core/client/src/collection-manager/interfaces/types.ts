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
  // NOTE: set to `true` means field could be used as a title field
  titleUsable?: boolean;
  [key: string]: any;
}
