/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, useFlowModel, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, ButtonProps, Popover, Select, Space } from 'antd';
import React, { FC } from 'react';
import { FilterGroup } from '../../components/FilterGroup';
import { GlobalActionModel } from '../base/ActionModel';
import { DataBlockModel } from '../base/BlockModel';
import { isEmptyFilter, removeNullCondition } from '@nocobase/utils/client';

const FilterContent: FC<{ value: any }> = (props) => {
  const modelInstance = useFlowModel();
  const currentBlockModel = modelInstance.ctx.currentBlockModel as DataBlockModel;
  const fields = currentBlockModel.collection.getFields().filter((field) => {
    // 过滤掉附件字段，因为会报错：Target collection attachments not found for field xxx
    return field.target !== 'attachments';
  });

  const ignoreFieldsNames = getIgnoreFieldsNames(
    modelInstance.props.filterableFieldsNames || [],
    fields.map((field) => field.name),
  );
  const t = modelInstance.translate;

  return (
    <>
      <FilterGroup value={props.value} fields={fields} ignoreFieldsNames={ignoreFieldsNames} model={modelInstance} />
      <Space style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => modelInstance.dispatchEvent('reset')}>{t('Reset')}</Button>
        <Button type="primary" onClick={() => modelInstance.dispatchEvent('submit')}>
          {t('Submit')}
        </Button>
      </Space>
    </>
  );
};

export class FilterActionModel extends GlobalActionModel {
  declare props: ButtonProps & {
    filterValue?: any;
    ignoreFieldsNames?: string[];
    open?: boolean;
    position: 'left';
  };

  defaultProps: any = {
    type: 'default',
    title: escapeT('Filter'),
    icon: 'FilterOutlined',
    filterValue: { $and: [] },
  };

  render() {
    return (
      <Popover
        open={this.props.open}
        content={<FilterContent value={this.props.filterValue} />}
        trigger="click"
        placement="bottomLeft"
        onOpenChange={(open) => {
          // 解决当鼠标点击其他地方时，Popover 不关闭的问题
          if (open === false) {
            this.setProps('open', undefined);
          }
        }}
      >
        {super.render()}
      </Popover>
    );
  }
}

FilterActionModel.define({
  title: escapeT('Filter'),
  toggleDetector: (model) => {
    let ret = false;
    model.findSubModel('actions', (action) => {
      if (action.constructor === FilterActionModel) {
        ret = true;
      }
    });
    return ret;
  },
  customRemove: async (model, item) => {
    model.findSubModel('actions', (action) => {
      if (action instanceof FilterActionModel) {
        action.destroy();
      }
    });
  },
});

FilterActionModel.registerFlow({
  key: 'filterSettings',
  title: escapeT('Filter settings'),
  auto: true,
  steps: {
    position: {
      handler(ctx, params) {
        ctx.model.setProps('position', params.position || 'left');
      },
    },
    filterableFieldsNames: {
      title: escapeT('Filterable fields'),
      uiSchema: {
        filterableFieldsNames: {
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model } = useFlowSettingsContext();
            const options = model.ctx.currentBlockModel.collection.getFields().map((field) => {
              return {
                label: field.title,
                value: field.name,
              };
            });
            return <Select {...props} options={options} />;
          },
          'x-component-props': {
            mode: 'multiple',
            placeholder: escapeT('Please select non-filterable fields'),
          },
        },
      },
      defaultParams(ctx) {
        const names = ctx.currentBlockModel.collection.getFields().map((field) => field.name);
        return {
          filterableFieldsNames: names || [],
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('filterableFieldsNames', params.filterableFieldsNames);
      },
    },
    defaultFilter: {
      title: escapeT('Default filter conditions'),
      uiSchema: {
        defaultFilter: {
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model: modelInstance } = useFlowSettingsContext();
            const currentBlockModel = modelInstance.ctx.currentBlockModel;
            const fields = currentBlockModel.collection.getFields();
            const ignoreFieldsNames = modelInstance.props.ignoreFieldsNames || [];

            return (
              <FilterGroup
                value={props.value || {}}
                fields={fields}
                ignoreFieldsNames={ignoreFieldsNames}
                model={modelInstance}
              />
            );
          },
        },
      },
      defaultParams(ctx) {
        return {
          defaultFilter: ctx.model.defaultProps.filterValue,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('filterValue', params.defaultFilter);
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'submitSettings',
  on: 'submit',
  steps: {
    submit: {
      handler(ctx, params) {
        const resource = ctx.currentBlockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }

        if (!isEmptyFilter(ctx.model.props.filterValue)) {
          resource.addFilterGroup(ctx.model.uid, removeNullCondition(ctx.model.props.filterValue));
          resource.setPage(1);
        }
        resource.refresh();
        ctx.model.setProps('open', false);
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'resetSettings',
  title: escapeT('Reset'),
  on: 'reset',
  steps: {
    submit: {
      handler(ctx, params) {
        const resource = ctx.currentBlockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        resource.removeFilterGroup(ctx.model.uid);
        resource.refresh();
        ctx.model.setProps('open', false);
        ctx.model.setProps('filterValue', clearInputValue(ctx.model.props.filterValue));
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'openSettings',
  on: 'click',
  steps: {
    open: {
      handler(ctx, params) {
        ctx.model.setProps('open', !ctx.model.props.open);
      },
    },
  },
});

function getIgnoreFieldsNames(filterableFieldsNames: string[], allFields: string[]) {
  return allFields.filter((field) => !filterableFieldsNames.includes(field));
}

function clearInputValue(value: any) {
  if (Array.isArray(value)) {
    return value.map((item) => clearInputValue(item));
  } else if (typeof value === 'object' && value !== null) {
    const newValue: any = {};
    for (const key in value) {
      newValue[key] = clearInputValue(value[key]);
    }
    return newValue;
  } else if (typeof value === 'string') {
    return '';
  }
  return undefined;
}
