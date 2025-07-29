/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import {
  AddActionButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  MultiRecordResource,
  SingleRecordResource,
  buildActionItems,
  escapeT,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Pagination, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { RecordActionModel } from '../../base/ActionModel';
import { CollectionBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';

export class DetailsModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: DetailsFieldGridModel; actions?: RecordActionModel[] };
}> {
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
    console.log(this.props);
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

              <AddActionButton
                model={this}
                items={buildActionItems(this, 'RecordActionModel')}
                onModelCreated={async (actionModel) => {
                  actionModel.setStepParams('buttonSettings', 'general', { type: 'default' });
                }}
              />
            </Space>
          </div>
        </DndProvider>
        <FormLayout colon={colon} labelAlign={labelAlign} labelWidth={labelWidth} labelWrap={labelWrap} layout={layout}>
          <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        </FormLayout>
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
    layout: {
      use: 'layout',
      title: tval('Layout'),
    },
  },
});

DetailsModel.define({
  title: escapeT('Details'),
  defaultOptions: {
    use: 'DetailsModel',
    subModels: {
      grid: {
        use: 'DetailsFieldGridModel',
      },
    },
  },
  sort: 350,
});
