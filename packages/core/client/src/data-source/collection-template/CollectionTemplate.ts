/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions, Collection } from '../collection';
import type { ISchema } from '@formily/react';
import type { CollectionTemplateManager } from './CollectionTemplateManager';
import type { Application } from '../../application/Application';

interface AvailableFieldInterfacesInclude {
  include?: any[];
}

interface AvailableFieldInterfacesExclude {
  exclude?: any[];
}

interface CollectionTemplateDefaultOptions {
  /**
   * Auto-generate id
   * @default true
   * */
  autoGenId?: boolean;
  /** Created by */
  createdBy?: boolean;
  /** Updated by */
  updatedBy?: boolean;
  /** Created at */
  createdAt?: boolean;
  /** Updated at */
  updatedAt?: boolean;
  /** Sortable */
  sortable?: boolean;
  /* Tree structure */
  tree?: string;
  /* Logging */
  logging?: boolean;
  /** Inherits */
  inherits?: string | string[];
  /* Field list */
  fields?: CollectionOptions['fields'];
}

export type CollectionTemplateFactory = new (
  collectionTemplateManager: CollectionTemplateManager,
) => CollectionTemplate;
export abstract class CollectionTemplate {
  constructor(public collectionTemplateManager: CollectionTemplateManager) {}
  name: string;
  Collection?: typeof Collection;
  title?: string;
  color?: string;
  /** Sorting */
  order?: number;
  /** Default configuration */
  default?: CollectionTemplateDefaultOptions;
  events?: any;
  /** UI configurable CollectionOptions parameters (fields for adding or editing Collection forms) */
  configurableProperties?: Record<string, ISchema>;
  /** Available field types for the current template */
  availableFieldInterfaces?: AvailableFieldInterfacesInclude & AvailableFieldInterfacesExclude;
  /** Whether it is a divider */
  divider?: boolean;
  /** Template description */
  description?: string;
  /** Configure buttons in the configuration fields */
  configureActions?: Record<string, ISchema>;
  // Whether to prohibit deleting fields
  forbidDeletion?: boolean;

  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];

  transform?(collection: CollectionOptions, app: Application): CollectionOptions;
}
