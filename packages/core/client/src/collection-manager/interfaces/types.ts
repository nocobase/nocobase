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
  /** 不支持使用变量的值进行设置 */
  invariable?: boolean;
  // NOTE: set to `true` means field could be used as a title field
  titleUsable?: boolean;
  [key: string]: any;
}
