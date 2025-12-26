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
      get: () => null,
    });
  }

  _defaultCustomModelClasses = {
    FormActionGroupModel: 'FormActionGroupModel',
    FormItemModel: 'FormItemModel',
    FormCustomItemModel: 'FormCustomItemModel',
  };

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
    const { dataSourceKey, collectionName, associationName } = ctx.view.inputArgs;
    // const dataSources = ctx.dataSourceManager
    //   .getDataSources()
    //   .map((dataSource) => {
    //     if (dataSource.getCollections().length === 0) {
    //       return null;
    //     }
    //     return {
    //       key: genKey(`ds-${dataSource.key}`),
    //       label: dataSource.displayName,
    //       searchable: true,
    //       searchPlaceholder: tExpr('Search'),
    //       children: (ctx) => {
    //         return dataSource
    //           .getCollections()
    //           .map((collection) => {
    //             if (!this.filterCollection(collection)) {
    //               return null;
    //             }
    //             const initOptions = {
    //               dataSourceKey: collection.dataSourceKey,
    //               collectionName: collection.name,
    //             };
    //             return {
    //               key: genKey(`ds-${dataSource.key}.${collection.name}`),
    //               label: collection.title,
    //               useModel: this.name,
    //               createModelOptions: createModelOptions({
    //                 stepParams: {
    //                   resourceSettings: {
    //                     init: initOptions,
    //                   },
    //                 },
    //               }),
    //             };
    //           })
    //           .filter(Boolean);
    //       },
    //     };
    //   })
    //   .filter(Boolean);
    // const children = (ctx) => {
    //   if (dataSources.length === 1) {
    //     return dataSources[0].children(ctx);
    //   }
    //   return dataSources;
    // };
    // if (!collectionName) {
    //   return children(ctx);
    // }
    // if (this._isScene('new') || this._isScene('select')) {
    //   const initOptions = {
    //     dataSourceKey,
    //     collectionName,
    //     // filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    //   };
    //   if (associationName) {
    //     initOptions['associationName'] = associationName;
    //     initOptions['sourceId'] = '{{ctx.view.inputArgs.sourceId}}';
    //   }
    //   return [
    //     {
    //       key: genKey('current-collection'),
    //       label: 'Current collection',
    //       useModel: this.name,
    //       createModelOptions: createModelOptions({
    //         stepParams: {
    //           resourceSettings: {
    //             init: initOptions,
    //           },
    //         },
    //       }),
    //     },
    //     {
    //       key: genKey('others-collections'),
    //       label: 'Other collections',
    //       children: children(ctx),
    //     },
    //   ];
    // }
    // const items = [
    //   {
    //     key: genKey('associated'),
    //     label: 'Associated records',
    //     children: () => {
    //       const collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
    //       return collection
    //         .getAssociationFields(this._getScene())
    //         .map((field) => {
    //           if (!field.targetCollection) {
    //             return null;
    //           }
    //           if (!this.filterCollection(field.targetCollection)) {
    //             return null;
    //           }
    //           let sourceId = `{{ctx.popup.record.${field.sourceKey || field.collection.filterTargetKey}}}`;
    //           if (field.sourceKey === field.collection.filterTargetKey) {
    //             sourceId = '{{ctx.view.inputArgs.filterByTk}}'; // 此时可以直接通过弹窗url读取，减少后端解析
    //           }
    //           const initOptions = {
    //             dataSourceKey,
    //             collectionName: field.target,
    //             associationName: field.resourceName,
    //             sourceId,
    //           };
    //           return {
    //             key: genKey(`associated-${field.name}`),
    //             label: field.title,
    //             useModel: this.name,
    //             createModelOptions: createModelOptions({
    //               stepParams: {
    //                 resourceSettings: {
    //                   init: initOptions,
    //                 },
    //               },
    //             }),
    //           };
    //         })
    //         .filter(Boolean);
    //     },
    //   },
    //   {
    //     key: genKey('others-records'),
    //     label: 'Other records',
    //     children: children(ctx),
    //   },
    // ];
    // if (this._isScene('one')) {
    //   const currentCollection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
    //   if (!currentCollection || !this.filterCollection(currentCollection)) {
    //     return items;
    //   }
    //   const initOptions = {
    //     dataSourceKey,
    //     collectionName,
    //     filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
    //   };
    //   if (associationName) {
    //     initOptions['associationName'] = associationName;
    //     initOptions['sourceId'] = '{{ctx.view.inputArgs.sourceId}}';
    //   }
    //   items.unshift( as any);
    // }
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

  // getCurrentRecord() {
  //   return this.context.record;
  // }
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

SubTableEditFormModel.define({
  label: tExpr('Form (Edit)'),
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
