import { ISchema } from '@formily/react';
import { ReactNode } from 'react';

export interface CollectionOptions {
  [key: string]: any;
}

export interface CollectionManagerOptions {
  service?: any;
  interfaces?: any;
  collections?: CollectionOptions[];
  templates?: any;
  refreshCM?: () => Promise<void>;
  children?: ReactNode;
  updateCollection?: (collection: any) => void;
}

export type FieldOptions = CollectionOptions['fields'][0];

export interface ICollectionProviderProps {
  name?: string;
  fields?: any;
}

export interface CollectionFieldOptions {
  name?: any;
  collectionName?: string;
  sourceKey?: string; // association field
  uiSchema?: ISchema;
  target?: string;

  [key: string]: any;
}
