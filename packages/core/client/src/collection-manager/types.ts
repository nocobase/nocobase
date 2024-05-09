/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
