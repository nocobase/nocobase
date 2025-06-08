/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataBlockModel } from './dataBlockModel';
import { ActionModel } from './actions/actionModel';
import { observable } from '@formily/reactive';
import { MultiRecordResource } from '../resources/multiRecordResource';
import { StepParams } from '../types';

// TODO: 未完成

export class TableBlockModel<TData = any> extends DataBlockModel {
  public rowActions: Map<string, ActionModel>;
  public declare resource: MultiRecordResource<TData>;

  constructor(options: { uid: string; stepParams?: StepParams; resource?: MultiRecordResource<TData> }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
      resource: options.resource,
    });
    this.rowActions = observable(new Map<string, ActionModel>());
  }

  setRowActions(actions: ActionModel[]) {
    this.rowActions.clear();
    actions.forEach((action) => this.rowActions.set(action.uid, action));
  }

  addRowAction(action: ActionModel) {
    this.rowActions.set(action.uid, action);
  }

  getRowAction(uid: string): ActionModel | undefined {
    return this.rowActions.get(uid);
  }

  removeRowAction(uid: string): boolean {
    return this.rowActions.delete(uid);
  }

  getRowActions(): ActionModel[] {
    return Array.from(this.rowActions.values());
  }

  async reload(): Promise<any[] | null> {
    await this.resource.refresh();
    return this.resource.getData();
  }

  async reset(): Promise<any[] | null> {
    this.resource.setPage(1);
    this.resource.setFilter({});
    await this.resource.refresh();
    return this.resource.getData();
  }

  async applyFilter(filter: Record<string, any>): Promise<any[] | null> {
    this.resource.setFilter(filter);
    await this.resource.refresh();
    return this.resource.getData();
  }

  async applySort(field: string, direction: 'asc' | 'desc'): Promise<any[] | null> {
    // TODO: 需要在MultiRecordResource中添加排序支持
    await this.resource.refresh();
    return this.resource.getData();
  }
}
