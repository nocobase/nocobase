/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Liquid } from 'liquidjs';
import { variableFilters, filterGroups } from '../filters';
import { escape } from '../escape';
type FilterGroup = {
  name: string;
  title: string;
  sort: number;
};

type Filter = {
  name: string;
  title: string;
  handler: (...args: any[]) => any;
  group: string;
  uiSchema?: any;
  sort: number;
};

export class JSONTemplateParser {
  engine: Liquid;
  private _filterGroups: Array<FilterGroup>;
  private _filters: Array<Filter>;

  constructor() {
    this.engine = new Liquid();
    this._filterGroups = [];
    this._filters = [];
    filterGroups.forEach((group) => {
      this.registerFilterGroup(group);
    });

    variableFilters.forEach((filter) => {
      this.registerFilter(filter);
    });
  }

  get filterGroups(): Array<
    FilterGroup & {
      filters: Array<Filter>;
    }
  > {
    return this._filterGroups.map((group) => ({
      ...group,
      filters: this._filters.filter((filter) => filter.group === group.name),
    }));
  }

  registerFilterGroup(group: FilterGroup): void {
    this._filterGroups.push(group);
  }
  registerFilter(filter: Filter): void {
    this._filters.push(filter);
    this.engine.registerFilter(filter.name, filter.handler);
  }

  render(template: string, data: any = {}): any {
    return this.engine.parseAndRenderSync(escape(template), escape(data));
  }
}

const parser = new JSONTemplateParser();

export function createJSONTemplateParser() {
  return parser;
}
