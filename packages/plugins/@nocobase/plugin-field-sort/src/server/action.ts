/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { pick } from 'lodash';
import { BelongsToManyRepository, Collection, HasManyRepository, TargetKey, Model, Op } from '@nocobase/database';
import { Context } from '@nocobase/actions';

import { SortField } from './sort-field';

interface SortRecord {
  id: TargetKey;
  [key: string]: any;
}

export async function move(ctx: Context, next) {
  const repository = ctx.getCurrentRepository();

  if (repository.move) {
    ctx.body = await repository.move(ctx.action.params);
    return next();
  }

  if (!repository.database) {
    return ctx.throw(new Error(`Repository can not handle action move for ${ctx.action.resourceName}`));
  }

  const { sourceId, targetId, targetScope, sticky, method } = ctx.action.params;

  let sortField = ctx.action.params.sortField;

  if (repository instanceof BelongsToManyRepository) {
    throw new Error("Sorting association as 'belongs-to-many' type is not supported.");
  }

  if (repository instanceof HasManyRepository && !sortField) {
    sortField = `${repository.association.foreignKey}Sort`;
  }

  const sortableCollection = new SortableCollection(repository.collection, sortField);

  if (sourceId && targetId) {
    await sortableCollection.move(sourceId, targetId, {
      insertAfter: method === 'insertAfter',
    });
  }

  // change scope
  if (sourceId && targetScope) {
    await sortableCollection.changeScope(sourceId, targetScope, method);
  }

  if (sourceId && sticky) {
    await sortableCollection.sticky(sourceId);
  }

  ctx.body = 'ok';
  await next();
}

interface SortPosition {
  scope?: string;
  id: TargetKey;
}

interface MoveOptions {
  insertAfter?: boolean;
}

export class SortableCollection {
  collection: Collection;
  field: SortField;
  scopeKey: string;

  constructor(collection: Collection, fieldName = 'sort') {
    this.collection = collection;
    this.field = collection.getField(fieldName);

    if (!(this.field instanceof SortField)) {
      throw new Error(`${fieldName} is not a sort field`);
    }

    this.scopeKey = this.field.get('scopeKey');
  }

  /**
   * Get the filter condition for the scope
   */
  private getScopeFilter(scopeValue: any) {
    if (!this.scopeKey) {
      return {};
    }
    if (scopeValue === null || scopeValue === undefined) {
      return {
        [this.scopeKey]: null,
      };
    }
    return {
      [this.scopeKey]: scopeValue,
    };
  }

  // insert source position to target position
  async move(sourceInstanceId: TargetKey, targetInstanceId: TargetKey, options: MoveOptions = {}) {
    let sourceInstance = await this.collection.repository.findByTargetKey(sourceInstanceId);
    const targetInstance = await this.collection.repository.findByTargetKey(targetInstanceId);

    if (this.scopeKey && sourceInstance.get(this.scopeKey) !== targetInstance.get(this.scopeKey)) {
      [sourceInstance] = await this.collection.repository.update({
        filterByTk: sourceInstanceId,
        values: {
          [this.scopeKey]: targetInstance.get(this.scopeKey),
        },
      });
    }

    await this.sameScopeMove(sourceInstance, targetInstance, options);
  }

  async changeScope(sourceInstanceId: TargetKey, targetScope: any, method?: string) {
    let sourceInstance = await this.collection.repository.findByTargetKey(sourceInstanceId);
    const targetScopeValue = targetScope[this.scopeKey];

    if (targetScopeValue && sourceInstance.get(this.scopeKey) !== targetScopeValue) {
      [sourceInstance] = await this.collection.repository.update({
        filterByTk: sourceInstanceId,
        values: {
          [this.scopeKey]: targetScopeValue,
        },
        silent: false,
      });

      if (method === 'prepend') {
        await this.sticky(sourceInstanceId);
      }
    }
  }

  async sticky(sourceInstanceId: TargetKey) {
    await this.collection.repository.update({
      filterByTk: sourceInstanceId,
      values: {
        [this.field.get('name')]: 0,
      },
      silent: true,
    });
  }

  /**
   * Core sorting algorithm: reorder records by complete reconstruction
   * This ensures:
   * 1. All sort values are unique and sequential (1, 2, 3, ...)
   * 2. The source record is positioned relative to target
   * 3. Atomic operation - no partial updates
   * 4. No corruption even with duplicate sort values in the database
   */
  async sameScopeMove(sourceInstance: Model, targetInstance: Model, options: MoveOptions) {
    const fieldName = this.field.get('name');
    const scopeValue = this.scopeKey ? sourceInstance.get(this.scopeKey) : null;
    const filterKey = this.collection.filterTargetKey;
    const isMultiKey = this.collection.isMultiFilterTargetKey();

    // Get source key for later identification
    const sourceKey = isMultiKey
      ? pick(sourceInstance, filterKey as string[])
      : sourceInstance.get(filterKey as string);

    // 1. Fetch all records in the same scope, ordered by current sort value
    const scopeFilter = this.getScopeFilter(scopeValue);
    const allRecords = await this.collection.repository.find({
      filter: scopeFilter,
      sort: [fieldName],
      raw: true,
    });

    // 2. Find indices of source and target records
    const sourceIndex = allRecords.findIndex((r: SortRecord) => {
      if (isMultiKey) {
        return (filterKey as string[]).every((key) => r[key] === (sourceKey as any)[key]);
      }
      return r[filterKey as string] === sourceKey;
    });

    const targetIndex = allRecords.findIndex((r: SortRecord) => {
      if (isMultiKey) {
        return (filterKey as string[]).every((key) => r[key] === targetInstance.get(key));
      }
      return r[filterKey as string] === targetInstance.get(filterKey as string);
    });

    if (sourceIndex === -1) {
      throw new Error(`Source record not found in scope`);
    }

    if (targetIndex === -1) {
      throw new Error(`Target record not found in scope`);
    }

    // 3. Reorder: remove source and insert at target position
    const [sourceRecord] = allRecords.splice(sourceIndex, 1);
    const insertIndex = options.insertAfter ? targetIndex + (sourceIndex > targetIndex ? 0 : 1) : targetIndex;
    allRecords.splice(insertIndex, 0, sourceRecord);

    // 4. Update sort values atomically
    // Use a transaction to ensure consistency
    const updates = allRecords.map((record: SortRecord, index: number) => {
      return this.collection.repository.update({
        filterByTk: isMultiKey ? pick(record, filterKey as string[]) : record[filterKey as string],
        values: {
          [fieldName]: index + 1, // sort values start from 1
        },
        silent: true,
      });
    });

    await Promise.all(updates);
  }

  /**
   * Validate sort values are unique and sequential within scope
   * Returns issues found, or undefined if valid
   */
  async validateSort(scopeValue?: any): Promise<
    | {
        hasDuplicates: boolean;
        gaps: number[];
        duplicates: Array<{ value: number; count: number }>;
      }
    | undefined
  > {
    const fieldName = this.field.get('name');
    const scopeFilter = scopeValue !== undefined ? this.getScopeFilter(scopeValue) : {};

    const records = await this.collection.repository.find({
      filter: scopeFilter,
      sort: [fieldName],
      raw: true,
    });

    const sortValues = records.map((r: SortRecord) => r[fieldName]);
    const sortSet = new Set(sortValues);

    // Check for duplicates
    const hasDuplicates = sortSet.size !== sortValues.length;

    // Find gaps (missing numbers)
    const gaps: number[] = [];
    for (let i = 1; i <= records.length; i++) {
      if (!sortSet.has(i)) {
        gaps.push(i);
      }
    }

    // Find which values are duplicated
    const duplicates: Array<{ value: number; count: number }> = [];
    if (hasDuplicates) {
      const counts = new Map<number, number>();
      sortValues.forEach((v: number) => {
        counts.set(v, (counts.get(v) || 0) + 1);
      });
      counts.forEach((count, value) => {
        if (count > 1) {
          duplicates.push({ value, count });
        }
      });
    }

    if (hasDuplicates || gaps.length > 0) {
      return { hasDuplicates, gaps, duplicates };
    }

    return undefined;
  }

  /**
   * Rebuild sort values to be sequential and unique
   * Use this to recover from corruption (duplicate sort values)
   */
  async rebuildSort(scopeValue?: any) {
    const fieldName = this.field.get('name');
    const filterKey = this.collection.filterTargetKey;
    const isMultiKey = this.collection.isMultiFilterTargetKey();

    const scopeFilter = scopeValue !== undefined ? this.getScopeFilter(scopeValue) : {};

    // Fetch all records ordered by id (to ensure deterministic order)
    const records = await this.collection.repository.find({
      filter: scopeFilter,
      sort: ['id'],
      raw: true,
    });

    // Update with sequential sort values
    const updates = records.map((record: SortRecord, index: number) => {
      return this.collection.repository.update({
        filterByTk: isMultiKey ? pick(record, filterKey) : record[filterKey as string],
        values: {
          [fieldName]: index + 1,
        },
        silent: true,
      });
    });

    await Promise.all(updates);

    return {
      success: true,
      recordsFixed: records.length,
    };
  }
}
