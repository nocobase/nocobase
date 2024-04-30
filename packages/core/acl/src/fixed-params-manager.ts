/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { assign } from '@nocobase/utils';

type Context = any;
export type Merger = () => object;

export type ActionPath = string;

const SPLIT = ':';

export default class FixedParamsManager {
  merger = new Map<ActionPath, Array<Merger>>();

  addParams(resource: string, action: string, merger: Merger) {
    const path = this.getActionPath(resource, action);
    this.merger.set(path, [...this.getParamsMerger(resource, action), merger]);
  }

  getParamsMerger(resource: string, action: string) {
    const path = this.getActionPath(resource, action);
    return this.merger.get(path) || [];
  }

  protected getActionPath(resource: string, action: string) {
    return `${resource}${SPLIT}${action}`;
  }

  getParams(resource: string, action: string, extraParams: any = {}) {
    const results = {};
    for (const merger of this.getParamsMerger(resource, action)) {
      FixedParamsManager.mergeParams(results, merger());
    }

    if (extraParams) {
      FixedParamsManager.mergeParams(results, extraParams);
    }

    return results;
  }

  static mergeParams(a: any, b: any) {
    assign(a, b, {
      filter: 'andMerge',
      fields: 'intersect',
      appends: 'union',
      except: 'union',
      whitelist: 'intersect',
      blacklist: 'intersect',
      sort: 'overwrite',
    });
  }
}
