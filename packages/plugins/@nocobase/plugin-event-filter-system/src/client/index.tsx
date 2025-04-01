/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { EventManager } from './event-manager';
import { FilterManager } from './filter-manager';
import { Resource } from '@nocobase/resourcer';
import { ComponentProps } from 'react';
import { LinkageRuleSettings, LinkageRuleItem } from './types';
import React from 'react';
export * from './event-manager';
export * from './filter-manager';
export * from './hooks';
export * from './types';

function convertLinkageRuleSettings(settings: LinkageRuleSettings) {
  const ret = {};
  Object.keys(settings || {}).forEach((key) => {
    const item = settings[key];
    Object.keys(item).forEach((itemKey) => {
      const ruleItem: LinkageRuleItem = item[itemKey];
      ret[key] = ret[key] || {};
      ret[key][itemKey] = (record) => {
        const condition = ruleItem.condition;
        const actions = ruleItem.actions;
        const props = {};
        const checkCondition = () => {
          const checkConditionItem = (conditionItem) => {
            const field = Object.keys(conditionItem)[0];
            const operator = Object.keys(conditionItem[field])[0];
            const value = conditionItem[field][operator];
            const recordValue = record[field];
            switch (operator) {
              case '$includes':
                return recordValue.includes(value);
              case '$notIncludes':
                return !recordValue.includes(value);
              case '$equals':
                return recordValue === value;
              case '$notEquals':
                return recordValue !== value;
              // TODO: add more operators here
            }
          };
          let conditionResult = false;
          // based on condition, set props
          if (condition.$and) {
            conditionResult = condition.$and.every(checkConditionItem);
          }
          if (condition.$or) {
            conditionResult = condition.$or.some(checkConditionItem);
          }
          return conditionResult;
        };
        if (checkCondition()) {
          // if conditionResult is true, set props
          const hidden = actions.filter((action) => action.operator === 'hidden' && !action.targetFields);
          props['hidden'] = hidden;
          // TODO: 增加Visible, disabled, readonly, editable
        }

        props['onChange'] = (value) => {
          if (checkCondition()) {
            actions.forEach((action) => {
              if (action.operator === '$set') {
                record[action.targetFields[0]] = value;
              }
              // TODO: 暂时只支持$set
            });
          }
        };
        // based on actions, set props
        actions.forEach((action) => {
          if (action.operator === '$set') {
            // record[action.targetFields[0]] = action.value.value;
            props['onChange'] = (value) => {
              record[action.targetFields[0]] = value;
            };
          }
        });
        return props;
      };
    });
  });

  return ret;
}

export class PluginEventFilterSystemClient extends Plugin {
  eventManager: EventManager;
  filterManager: FilterManager;

  constructor(options = {}, app) {
    super(options, app);
    this.eventManager = new EventManager();
    this.filterManager = new FilterManager();
  }

  async load() {
    this.app.eventManager = this.eventManager;
    this.app.filterManager = this.filterManager;
    this.loadDefaultFilters();
  }

  loadDefaultFilters() {
    this.filterManager.addFilter('core:block:table', async function propsFilter(input, ctx) {
      // props，一些通用配置，以及将linkageRules转换为函数(record) => props
      const { props, settings } = ctx;
      const output: any = {};
      output.height = settings?.height || props?.height;
      output.width = settings?.width || props?.width;
      output.title = settings?.title || props?.title;
      output.description = settings?.description || props?.description;
      // linkageRules should convert to function(record) => props
      const linkageRules = convertLinkageRuleSettings(settings?.linkageRules);
      // output.linkageRules = linkageRuleSettings.
      return {
        ...input,
        ...output,
        linkageRules,
      };
    });

    this.filterManager.addFilter('core:block:table', async function dataFilter(input, ctx) {
      // get data from resource
      const { resource, settings, resourceParams } = ctx;
      const fields = settings?.fields;
      const result = await resource.list({
        params: {
          ...resourceParams,
          append: fields,
        },
      });
      return {
        ...input,
        data: {
          ...result,
        },
      };
    });

    this.filterManager.addFilter('core:block:table', async function actionsFilter(input, ctx) {
      // get actions from settings and input
      const { settings } = ctx;
      const linkageRules = settings?.linkageRules;
      const actionSettings = settings?.actions;
      const actions = [];
      Object.keys(actionSettings || {}).forEach((key) => {
        const action = actionSettings[key];
        actions.push({
          ...action,
          ...linkageRules?.['actions'],
        });
      });

      return {
        ...input,
        actions,
      };
    });

    this.filterManager.addFilter('core:block:table', async function columnsFilter(input, ctx) {
      // get columns from settings and input
      const { settings } = ctx;
      const { linkageRules } = input;
      const columns = [];
      const fieldSettings = settings?.fields;
      const recordActions = settings?.recordActions;
      if (recordActions) {
        columns.push({
          ...recordActions,
          ...linkageRules?.['recordActions'],
        });
      }
      Object.keys(fieldSettings || {}).forEach((key) => {
        const field = fieldSettings[key];
        columns.push({
          title: field.label,
          dataIndex: key,
          key: key,
          ...linkageRules?.['fields']?.[key],
        });
      });
      if (columns.length === 0) {
        columns.push({
          title: 'No Data',
          dataIndex: 'noData',
          key: 'noData',
          render: () => {
            return <div>No Data</div>;
          },
        });
      }
      return {
        ...input,
        columns,
      };
    });
  }
}

export default PluginEventFilterSystemClient;
