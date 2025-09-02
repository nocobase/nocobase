/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelContext,
  FlowModelRenderer,
  FlowSettingsButton,
  MultiRecordResource,
  SingleRecordResource,
  escapeT,
  buildRecordMeta,
  inferRecordRef,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Pagination, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { RecordActionModel } from '../../base/ActionModel';
import { CollectionBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormComponent } from '../form/FormModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';

export class DetailsModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: DetailsFieldGridModel; actions?: RecordActionModel[] };
}> {
  static types = ['toOne', 'toMany'];

  createResource(ctx, params) {
    if (this.association?.type === 'hasOne' || this.association?.type === 'belongsTo') {
      const resource = new SingleRecordResource();
      resource.isNewRecord = false;
      return resource;
    }
    if (Object.keys(params).includes('filterByTk')) {
      const resource = new SingleRecordResource();
      resource.isNewRecord = false;
      return resource;
    }
    const resource = new MultiRecordResource();
    resource.setPageSize(1);
    return resource;
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
      meta: () =>
        buildRecordMeta(
          () => this.collection,
          this.context.t('Current record'),
          (ctx) => inferRecordRef(ctx),
        ),
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
    }
  };

  async refresh() {
    await this.resource.refresh();
  }

  renderPagination() {
    const resource = this.resource as MultiRecordResource;
    if (!this.isMultiRecordResource() || !resource.getPage()) {
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

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <>
        <DndProvider>
          <div style={{ padding: this.context.themeToken.padding, textAlign: 'right' }}>
            <Space>
              {this.mapSubModels('actions', (action) => {
                return (
                  <Droppable model={action} key={action.uid}>
                    <FlowModelRenderer
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
                );
              })}

              <AddSubModelButton
                key="details-actions-add"
                model={this}
                subModelKey="actions"
                subModelBaseClass={RecordActionModel}
                afterSubModelInit={async (actionModel) => {
                  actionModel.setStepParams('buttonSettings', 'general', { type: 'default' });
                }}
              >
                <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
              </AddSubModelButton>
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

DetailsModel.registerFlow({
  key: 'detailsSettings',
  title: escapeT('Details settings'),
  sort: 150,
  steps: {
    refresh: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        // 1. 先初始化字段网格，确保所有字段都创建完成
        await ctx.model.applySubModelsAutoFlows('grid');
      },
    },
    layout: {
      use: 'layout',
      title: escapeT('Layout'),
    },
  },
});

DetailsModel.define({
  label: escapeT('Details'),
  searchable: true,
  searchPlaceholder: escapeT('Search'),
  createModelOptions: {
    use: 'DetailsModel',
    subModels: {
      grid: {
        use: 'DetailsFieldGridModel',
      },
    },
  },
  sort: 350,
});
