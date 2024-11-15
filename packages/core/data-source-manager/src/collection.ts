/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions, ICollection, ICollectionManager, IField, IRepository } from './types';
import { default as lodash } from 'lodash';
import { CollectionField } from './collection-field';

export class Collection implements ICollection {
  repository: IRepository;
  fields: Map<string, IField> = new Map<string, IField>();

  constructor(
    protected options: CollectionOptions,
    protected collectionManager: ICollectionManager,
  ) {
    this.setRepository(options.repository);

    if (options.fields) {
      this.setFields(options.fields);
    }
  }

  get name() {
    return this.options.name;
  }

  get filterTargetKey() {
    return this.options.filterTargetKey;
  }

  updateOptions(options: CollectionOptions, mergeOptions?: any) {
    const newOptions = {
      ...this.options,
      ...lodash.cloneDeep(options),
    };

    this.options = newOptions;

    this.setFields(newOptions.fields || []);

    if (options.repository) {
      this.setRepository(options.repository);
    }

    return this;
  }

  setFields(fields: any[]) {
    const fieldNames = this.fields.keys();
    for (const fieldName of fieldNames) {
      this.removeField(fieldName);
    }

    for (const field of fields) {
      this.setField(field.name, field);
    }
  }

  setField(name: string, options: any) {
    const field = new CollectionField(options);
    this.fields.set(name, field);
    return field;
  }

  removeField(name: string) {
    this.fields.delete(name);
  }

  getField(name: string) {
    return this.fields.get(name);
  }

  getFieldByField(field: string): IField {
    for (const item of this.fields.values()) {
      if (item.options.field === field) {
        return item;
      }
    }
    return null;
  }

  getFields() {
    return [...this.fields.values()];
  }

  protected setRepository(repository: any) {
    const RepositoryClass = this.collectionManager.getRegisteredRepository(repository || 'Repository');
    this.repository = new RepositoryClass(this);
  }
}
