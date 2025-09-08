/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { FormButtonGroup } from '@formily/antd-v5';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { FilterBlockModel } from '../../base/BlockModel';
import { FormComponent } from '../../blocks/form/FormModel';
import { FilterManager } from '../filter-manager/FilterManager';

export class FilterFormBlockModel extends FilterBlockModel<{
  subModels: {
    grid: any; // Replace with actual type if available
    actions?: any[]; // Replace with actual type if available
  };
}> {
  /**
   * 是否需要自动触发筛选，当字段值变更时自动执行筛选
   */
  autoTriggerFilter = true;

  get form() {
    return this.context.form;
  }

  addAppends() {}

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
  }

  onMount() {
    super.onMount();
    this.context.defineProperty('filterFormGridModel', {
      value: this.subModels.grid,
    });
  }

  async destroy(): Promise<boolean> {
    const result = await super.destroy();

    // 清理所有子模型的筛选配置
    const filterManager: FilterManager = this.context.filterManager;
    const promises = this.subModels.grid.subModels.items.map(async (item) => {
      await filterManager.removeFilterConfig({ filterId: item.uid });
    });

    await Promise.all(promises);
    return result;
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <FormButtonGroup align="right">
            {this.mapSubModels('actions', (action) => (
              <Droppable model={action} key={action.uid}>
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            ))}
            <AddSubModelButton
              key="filter-form-actions-add"
              model={this}
              subModelKey="actions"
              subModelBaseClass={'FilterFormActionModel'}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          </FormButtonGroup>
        </DndProvider>
      </FormComponent>
    );
  }
}

FilterFormBlockModel.define({
  label: tval('Form'),
  createModelOptions: {
    use: 'FilterFormBlockModel',
    subModels: {
      grid: {
        use: 'FilterFormGridModel',
      },
    },
  },
});

FilterFormBlockModel.registerFlow({
  key: 'formFilterBlockModelSettings',
  title: tval('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: tval('Layout'),
    },
  },
});
