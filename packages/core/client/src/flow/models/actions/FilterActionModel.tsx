/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, useFlowModel, useStepSettingContext } from '@nocobase/flow-engine';
import { Button, ButtonProps, Popover, Select, Space } from 'antd';
import React, { FC } from 'react';
import { FilterGroup } from '../../components/FilterGroup';
import { GlobalActionModel } from '../base/ActionModel';
import { DataBlockModel } from '../base/BlockModel';

const FilterContent: FC<{ value: any }> = (props) => {
  const modelInstance = useFlowModel();
  const currentBlockModel = modelInstance.ctx.shared.currentBlockModel as DataBlockModel;
  const fields = currentBlockModel.collection.getFields();
  const ignoreFieldsNames = modelInstance.props.ignoreFieldsNames || [];
  const t = modelInstance.translate;

  return (
    <>
      <FilterGroup value={props.value} fields={fields} ignoreFieldsNames={ignoreFieldsNames} ctx={modelInstance.ctx} />
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
    ignoreFieldsNames: [],
  };

  render() {
    return (
      <Popover
        open={this.props.open}
        content={<FilterContent value={this.props.filterValue || this.defaultProps.filterValue} />}
        trigger="click"
        placement="bottomLeft"
      >
        {super.render()}
      </Popover>
    );
  }
}

FilterActionModel.define({
  title: escapeT('Filter'),
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
    ignoreFieldsNames: {
      title: escapeT('Filterable fields'),
      uiSchema: {
        ignoreFieldsNames: {
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model } = useStepSettingContext();
            const options = model.ctx.shared.currentBlockModel.collection.getFields().map((field) => {
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
        return {
          ignoreFieldsNames: ctx.model.defaultProps.ignoreFieldsNames || [],
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('ignoreFieldsNames', params.ignoreFieldsNames);
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
            const { model: modelInstance } = useStepSettingContext();
            const currentBlockModel = modelInstance.ctx.shared.currentBlockModel;
            const fields = currentBlockModel.collection.getFields();
            const ignoreFieldsNames = modelInstance.props.ignoreFieldsNames || [];

            return (
              <FilterGroup
                value={props.value || {}}
                fields={fields}
                ignoreFieldsNames={ignoreFieldsNames}
                ctx={modelInstance.ctx}
              />
            );
          },
        },
      },
      defaultParams(ctx) {
        return {
          filterValue: ctx.model.defaultProps.filterValue,
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
        const resource = ctx.shared?.currentBlockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        resource.addFilterGroup(ctx.model.uid, ctx.model.props.filterValue);
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
        const resource = ctx.shared?.currentBlockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        resource.removeFilterGroup(ctx.model.uid);
        resource.refresh();
        ctx.model.setProps('open', false);
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
