import { ISchema } from '@formily/react';
import { ReactNode } from 'react';

type dumpable = 'required' | 'optional' | 'skip';
type CollectionSortable = string | boolean | { name?: string; scopeKey?: string };

export interface CollectionOptions {
  name: string;
  title?: string;
  namespace?: string;
  /**
   * Used for @nocobase/plugin-duplicator
   * @see packages/core/database/src/collection-group-manager.tss
   *
   * @prop {'required' | 'optional' | 'skip'} dumpable - Determine whether the collection is dumped
   * @prop {string[] | string} [with] - Collections dumped with this collection
   * @prop {any} [delayRestore] - A function to execute after all collections are restored
   */
  duplicator?:
    | dumpable
    | {
        dumpable: dumpable;
        with?: string[] | string;
        delayRestore?: any;
      };

  tableName?: string;
  inherits?: string[] | string;
  viewName?: string;
  writableView?: boolean;

  filterTargetKey?: string;
  fields?: FieldOptions[];
  model?: any;
  repository?: any;
  sortable?: CollectionSortable;
  /**
   * @default true
   */
  autoGenId?: boolean;
  /**
   * @default 'options'
   */
  magicAttribute?: string;

  tree?: string;

  template?: string;

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
