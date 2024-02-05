import type { ISchema } from '@formily/react';
import type { ReactNode } from 'react';
import type { CollectionManagerV2, CollectionOptionsV2 } from '../application';

export type CollectionOptions = CollectionOptionsV2;

export interface CollectionManagerOptions {
  collections?: CollectionOptions[];
  instance?: CollectionManagerV2;
  children?: ReactNode;
}

export type FieldOptions = any;

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
