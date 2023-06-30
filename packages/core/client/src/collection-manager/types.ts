import { ISchema } from '@formily/react';
import { ReactNode } from 'react';

export interface CollectionManagerOptions {
  service?: any;
  interfaces?: any;
  collections?: any[];
  templates?: any;
  refreshCM?: () => Promise<void>;
  children?: ReactNode;
  updateCollection?: (collection: any) => void;
}

export interface FieldOptions {
  type: string;
  interface?: string;
  uiSchema?: ISchema;

  [key: string]: any;
}

export interface CollectionOptions {
  name?: string;
  title?: string;
  filterTargetKey?: string;
  targetKey?: string;
  sortable?: any;
  fields?: FieldOptions[];
  inherits?: string[];
  tree?: string;
  template?: string;
  writableView?: boolean;
}

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
