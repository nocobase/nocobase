/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  tExpr,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  MemoFlowModelRenderer,
  useFlowModel,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { Space } from 'antd';
import React from 'react';
import { BlockSceneEnum } from '../../../../base';
import { FormBlockModel, FormComponent } from '../../../../blocks/form/FormBlockModel';

export class SubTableEditFormModel extends FormBlockModel {
  static scene = BlockSceneEnum.editInFront;
  private actionFlowSettings = { showBackground: false, showBorder: false, toolbarPosition: 'above' as const };
  private actionExtraToolbarItems = [
    {
      key: 'drag-handler',
      component: DragHandler,
      sort: 1,
    },
  ];
  onInit(options: any) {
    super.onInit(options);

    this.context.defineProperty('resourceName', {
      get: () => this.context.collection.name,
    });
    const recordData = this.context.view.inputArgs.record || {};
    this.context.defineProperty('record', {
      get: () => recordData,
    });
  }

  _defaultCustomModelClasses = {
    FormActionGroupModel: 'SubTableFormActionGroupModel',
    FormItemModel: 'FormItemModel',
    FormCustomItemModel: 'FormCustomItemModel',
  };

  protected defaultBlockTitle() {
    const blockLabel: any = <FormLabel />;
    const dsName = this.dataSource?.displayName || this.dataSource?.key;
    const dsCount = this.context?.dataSourceManager?.getDataSources?.().length || 0;
    const colTitle = this.collection?.title;
    const showDs = dsCount > 1 && !!dsName;
    const rightPart = `${showDs ? `${dsName} > ` : ''}${colTitle}`;

    return (
      <span>
        <span>{blockLabel}</span>
        <span>: </span>
        <span>{rightPart}</span>
      </span>
    ) as any;
  }

  /**
   * 定义子菜单选项
   */
  static async defineChildren(ctx) {
    const createModelOptions = (options) => {
      if (!this.meta?.createModelOptions) {
        return options || {};
      }
      if (typeof this.meta.createModelOptions === 'function') {
        const defaults = this.meta.createModelOptions(ctx);
        return _.merge({}, defaults, options);
      }
      return _.merge({}, this.meta.createModelOptions, options);
    };
    const genKey = (key) => {
      return this.name + key;
    };
    const { dataSourceKey, collectionName } = ctx.view.inputArgs;
    const initOptions = {
      dataSourceKey,
      collectionName,
    };
    return [
      {
        key: genKey('current-record'),
        label: 'Current record',
        useModel: this.name,
        createModelOptions: createModelOptions({
          stepParams: {
            resourceSettings: {
              init: initOptions,
            },
          },
        }),
      },
    ];
  }

  async onMount() {
    super.onMount();
  }

  getAclActionName() {
    return 'update';
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <Space wrap>
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <MemoFlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={this.context.flowSettingsEnabled ? this.actionFlowSettings : false}
                    extraToolbarItems={this.actionExtraToolbarItems}
                  />
                </Droppable>
              );
            })}
            {this.renderConfigureActions()}
          </Space>
        </DndProvider>
      </FormComponent>
    );
  }
}

const FormLabel = () => {
  const model: any = useFlowModel();
  const scene = model.parent?.scene || model.scene;
  const t = model.context.t;
  const title = scene === 'new' ? 'Form (Add new)' : 'Form (Edit)';
  return t(title);
};
SubTableEditFormModel.define({
  label: <FormLabel />,
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'SubTableEditFormModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
  sort: 340,
});
