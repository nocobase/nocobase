/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
  SingleRecordResource,
  createCurrentRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  tExpr,
} from '@nocobase/flow-engine';
import { Pagination, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { BlockGridModel, BlockSceneEnum, CollectionBlockModel, RecordActionModel } from '../../base';
import { FormComponent } from '../form/FormBlockModel';
import { DetailsGridModel } from './DetailsGridModel';
import { dispatchEventDeep } from '../../../utils';

export class DetailsBlockModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: DetailsGridModel; actions?: RecordActionModel[] };
}> {
  static scene = BlockSceneEnum.oam;

  _defaultCustomModelClasses = {
    RecordActionGroupModel: 'RecordActionGroupModel',
    DetailsItemModel: 'DetailsItemModel',
    DetailsAssociationFieldGroupModel: 'DetailsAssociationFieldGroupModel',
    DetailsCustomItemModel: 'DetailsCustomItemModel',
  };

  customModelClasses = {};

  createResource(ctx, params) {
    if (this.association?.type === 'hasOne' || this.association?.type === 'belongsTo') {
      const resource = this.context.createResource(SingleRecordResource);
      resource.isNewRecord = false;
      return resource;
    }
    if (Object.keys(params).includes('filterByTk')) {
      const resource = this.context.createResource(SingleRecordResource);
      resource.isNewRecord = false;
      return resource;
    }
    const resource = this.context.createResource(MultiRecordResource);
    resource.setPageSize(1);
    return resource;
  }

  onInit(options: any): void {
    super.onInit(options);
    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
      resolveOnServer: createRecordResolveOnServerWithLocal(
        () => this.collection,
        () => this.getCurrentRecord(),
      ),
      meta: recordMeta,
    });
  }

  isMultiRecordResource() {
    return this.resource instanceof MultiRecordResource;
  }

  getCurrentRecord() {
    const data = this.resource.getData();
    return Array.isArray(data) ? data[0] : data;
  }

  handlePageChange = async (page: number) => {
    if (this.resource instanceof MultiRecordResource) {
      const multiResource = this.resource as MultiRecordResource;
      multiResource.setPage(page);
      multiResource.loading = true;
      await this.refresh();
      await dispatchEventDeep(this, 'pageChangeFlow');
    }
  };

  async refresh() {
    await this.resource.refresh();
  }

  renderPagination() {
    const resource = this.resource as MultiRecordResource;
    if (!this.isMultiRecordResource() || !resource.getPage() || this.resource.getMeta('count') <= 1) {
      return null;
    }
    return (
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <Pagination
          simple
          pageSize={1}
          showSizeChanger={false}
          defaultCurrent={resource.getPage()}
          total={resource.getTotalPage()}
          onChange={this.handlePageChange}
          style={{ display: 'inline-block' }}
        />
      </div>
    );
  }

  renderConfigureActions() {
    return (
      <AddSubModelButton
        key="details-actions-add"
        model={this}
        subModelKey="actions"
        subModelBaseClass={this.getModelClassName('RecordActionGroupModel')}
        afterSubModelInit={async (actionModel) => {
          actionModel.setStepParams('buttonSettings', 'general', { type: 'default' });
        }}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return (
      <>
        <DndProvider>
          <div
            style={{
              textAlign: 'right',
              lineHeight: '0px',
              padding: isConfigMode && this.context.themeToken.padding,
            }}
          >
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                if (action.hidden && !isConfigMode) {
                  return;
                }
                return (
                  <Droppable model={action} key={action.uid}>
                    <FlowModelRenderer
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
              {this.renderConfigureActions()}
            </Space>
          </div>
        </DndProvider>
        <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
          <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        </FormComponent>
        {this.renderPagination()}
      </>
    );
  }
}

DetailsBlockModel.registerFlow({
  key: 'detailsSettings',
  title: tExpr('Details settings'),
  sort: 150,
  steps: {
    refresh: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 1. 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsBeforeRenderFlows('grid');
      },
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
    dataScope: {
      use: 'dataScope',
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    linkageRules: {
      use: 'detailsFieldLinkageRules',
    },
  },
});

DetailsBlockModel.define({
  label: tExpr('Details'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'DetailsBlockModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
  sort: 350,
});
