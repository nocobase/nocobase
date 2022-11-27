import { ISchema } from '@formily/react';

export interface ICollectionTemplate extends ISchema {
  name:string;
  order?: number;
  presetFields?: any[];
  color?: string,
  include?:string[],
  exclude?:string[],
  [key: string]: any;
}
