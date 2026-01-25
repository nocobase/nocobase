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
  tExpr,
  FlowModelRenderer,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { Form } from 'antd';
import React from 'react';
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import { BlockSceneEnum, FilterBlockModel } from '../../base';
import { FormComponent } from '../../blocks/form/FormBlockModel';
import { FilterManager } from '../filter-manager/FilterManager';
import { FilterFormItemModel } from './FilterFormItemModel';

export class FilterFormBlockModel extends FilterBlockModel<{
  subModels: {
    grid: any; // Replace with actual type if available
    actions?: any[]; // Replace with actual type if available
  };
}> {
  static scene = BlockSceneEnum.filter;

  /**
   * 是否需要自动触发筛选，当字段值变更时自动执行筛选
   */
  autoTriggerFilter = true;

  private removeTargetBlockListener?: () => void;

  get form() {
    return this.context.form;
  }

  get title() {
    return 'Filter form';
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form, cache: false });
  }

  addAppends() {}

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineMethod('refreshTargets', async () => {
      const gridModel = this.subModels.grid;
      const fieldModels: FilterFormItemModel[] = gridModel.subModels.items;
      fieldModels.forEach((fieldModel) => {
        fieldModel?.doFilter();
      });
    });
  }

  onMount() {
    super.onMount();
    this.context.defineProperty('filterFormGridModel', {
      value: this.subModels.grid,
    });

    // 监听页面区块删除，自动清理已失效的筛选字段
    const blockGridModel = this.context.blockGridModel;
    if (blockGridModel?.emitter) {
      const handleTargetRemoved = (model) => {
        if (!model?.uid || model.uid === this.uid) return;
        this.handleTargetBlockRemoved(model.uid);
      };
      blockGridModel.emitter.on('onSubModelRemoved', handleTargetRemoved);
      this.removeTargetBlockListener = () => blockGridModel.emitter.off('onSubModelRemoved', handleTargetRemoved);
    }
  }

  onUnmount() {
    this.removeTargetBlockListener?.();
    super.onUnmount();
  }

  private async handleTargetBlockRemoved(targetUid: string) {
    const filterManager: FilterManager = this.context.filterManager;
    const gridModel = this.subModels.grid;
    const fieldModels: FilterFormItemModel[] = gridModel.subModels.items || [];

    for (const fieldModel of [...fieldModels]) {
      const connectConfig = filterManager.getConnectFieldsConfig(fieldModel.uid);
      const targets = connectConfig?.targets || [];
      const hasTarget = targets.some((target) => target.targetId === targetUid);
      const defaultMatches = fieldModel.defaultTargetUid === targetUid;

      if (!hasTarget && !defaultMatches) continue;

      const remainingTargets = targets.filter((target) => target.targetId !== targetUid);

      if (remainingTargets.length > 0) {
        await filterManager.saveConnectFieldsConfig(fieldModel.uid, { targets: remainingTargets });
        continue;
      }

      await filterManager.removeFilterConfig({ filterId: fieldModel.uid });
      await fieldModel.destroy();
    }
  }

  async destroy(): Promise<boolean> {
    // 清理所有子模型的筛选配置
    const filterManager: FilterManager = this.context.filterManager;
    this.subModels.grid.subModels.items?.map((item) => {
      filterManager.removeFilterConfig({ filterId: item.uid, persist: false });
    });

    return await super.destroy();
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <FormComponent
        model={this}
        onFinish={() => {
          this.context.refreshTargets();
        }}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
      >
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <FormButtonGroup align="right">
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <FlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                    extraToolbarItems={[
                      {
                        key: 'drag-handler',
                        component: DragHandler,
                        sort: 1,
                      },
                    ]}
                  />
                </Droppable>
              );
            })}
            <AddSubModelButton
              key="filter-form-actions-add"
              model={this}
              subModelKey="actions"
              subModelBaseClass={'FilterFormActionGroupModel'}
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
  label: tExpr('Form'),
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
  title: tExpr('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
  },
});

FilterFormBlockModel.registerEvents({
  formValuesChange: {
    title: tExpr('Form values change'),
    name: 'formValuesChange',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});
