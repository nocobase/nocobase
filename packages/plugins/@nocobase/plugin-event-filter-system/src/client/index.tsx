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
import { LinkageRuleSettings, LinkageRuleItem, EventContext } from './types';
import React from 'react';
import { Modal, Form, Input } from 'antd';
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
    this.loadDefaultEventListeners();
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
      // just for demo, normally we already have data in ctx.props... no need to fetch again
      const result = await resource.list({
        params: {
          ...resourceParams,
          append: fields,
        },
      });
      return {
        ...input,
        data: {
          ...result?.data,
        },
      };
    });

    this.filterManager.addFilter('core:block:table', async (input, ctx) => {
      // get actions from settings and input
      const { settings } = ctx;
      const linkageRules = settings?.linkageRules;
      const actionSettings = settings?.actions;
      const actions = [];
      const handles = {
        addNew: (ctx: EventContext) => {
          this.eventManager.dispatchEvent('core:block:record:addNew', ctx);
        },
        delete: (ctx: EventContext) => {
          this.eventManager.dispatchEvent('core:block:table:record:delete', ctx);
        },
        refresh: (ctx: EventContext) => {
          this.eventManager.dispatchEvent('core:block:table:refresh', ctx);
        },
      };
      Object.keys(actionSettings || {}).forEach((key) => {
        const action = {
          ...actionSettings[key],
          ...linkageRules?.['actions'],
        };
        action['handle'] = handles[action.type];
        actions.push(action);
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
      let columns = [];
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
        columns = ctx?.props?.columns || []; // Just for Demo
        // columns.push({
        //   title: 'No Data',
        //   dataIndex: 'noData',
        //   key: 'noData',
        //   render: () => {
        //     return <div>No Data</div>;
        //   },
        // });
      }
      return {
        ...input,
        columns,
      };
    });
  }

  loadDefaultEventListeners() {
    this.eventManager.on('core:block:record:addNew', (ctx: EventContext) => {
      console.log('core:block:record:addNew', ctx);

      // Simple approach using Modal.open with form elements without Form component
      const modal = Modal.info({
        title: '新建记录',
        icon: null,
        content: (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <label>名称</label>
              </div>
              <Input placeholder="请输入名称" id="record-name-input" />
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>
                <label>描述</label>
              </div>
              <Input.TextArea placeholder="请输入描述" rows={4} id="record-description-input" />
            </div>
          </div>
        ),
        okText: '确定',
        cancelText: '取消',
        // Use footer to replace the default buttons
        footer: (
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <button
              onClick={() => {
                modal.destroy();
              }}
              style={{
                marginRight: 8,
                padding: '4px 15px',
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={() => {
                const nameInput = document.getElementById('record-name-input') as HTMLInputElement;
                const descInput = document.getElementById('record-description-input') as HTMLTextAreaElement;

                if (nameInput && nameInput.value) {
                  const values = {
                    name: nameInput.value,
                    description: descInput ? descInput.value : '',
                  };
                  console.log('Form values:', values);
                  modal.destroy();
                } else {
                  // Highlight the name input if empty
                  if (nameInput) {
                    nameInput.style.borderColor = 'red';
                    nameInput.focus();
                  }
                }
              }}
              style={{
                padding: '4px 15px',
                backgroundColor: '#1677ff',
                border: 'none',
                borderRadius: 2,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              确定
            </button>
          </div>
        ),
      });
    });
  }
}

export default PluginEventFilterSystemClient;
