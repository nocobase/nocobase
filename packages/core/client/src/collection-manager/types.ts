import { ISchema } from '@formily/react';
import { ReactNode } from 'react';
import { CollectionManagerV2, CollectionOptionsV2, CollectionV2 } from '../application';

export type CollectionOptions = CollectionOptionsV2;

export interface CollectionManagerOptions {
  service?: any;
  collections?: CollectionOptions[];
  // refreshCM?: () => Promise<void>;
  reloadCallback?: (collection: CollectionV2[]) => void;
  cm?: CollectionManagerV2;
  children?: ReactNode;
  updateCollection?: (collection: any) => void;
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
