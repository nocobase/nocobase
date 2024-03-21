import type { ISchema } from '@formily/react';
import type { ReactNode } from 'react';
import type { CollectionManager, CollectionOptions } from '../data-source';

export type { CollectionOptions } from '../data-source';

export interface CollectionManagerOptions {
  instance?: CollectionManager;
  children?: ReactNode;
}

export type FieldOptions = any;

export interface ICollectionProviderProps {
  name?: string;
  fields?: any;
}

export interface CollectionFieldOptions_deprecated {
  name?: any;
  collectionName?: string;
  sourceKey?: string; // association field
  uiSchema?: ISchema;
  target?: string;

  [key: string]: any;
}
