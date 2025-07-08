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
import { DataBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { DetailsFieldGridModel } from './DetailsFieldGridModel';

export class DetailsModel extends DataBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: DetailsFieldGridModel; actions?: RecordActionModel[] };
}> {
  declare resource: MultiRecordResource | SingleRecordResource;

  createResource(ctx, params) {
    if (Object.keys(params).includes('filterByTk')) {
      return new SingleRecordResource();
    }
    const resource = new MultiRecordResource();
    resource.setPageSize(1);
    return resource;
  }

  isMultiRecordResource() {
    return this.resource instanceof MultiRecordResource;
  }

  renderComponent() {
    const resource = this.resource as MultiRecordResource;
    const onPageChange = (page) => {
      resource.setPage(page);
      resource.loading = true;
      resource.refresh();
      const data = this.resource.getData();
      this.setSharedContext({
        currentRecord: Array.isArray(data) ? data[0] : data,
      });
    };
    return (
      <>
        <DndProvider>
          <div style={{ padding: this.context.themeToken.padding, textAlign: 'right' }}>
            <Space>
              {this.mapSubModels('actions', (action) => {
                return (
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

        <FormLayout layout={'vertical'}>
          <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        </FormLayout>
        {this.isMultiRecordResource() && (
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
              onChange={onPageChange}
              style={{ display: 'inline-block' }}
            />
          </div>
        )}
      </>
    );
  }
}

DetailsModel.registerFlow({
  key: 'detailsSettings',
  title: escapeT('Details settings'),
  auto: true,
  sort: 150,
  steps: {
    dataLoadingMode: {
      use: 'dataLoadingMode',
    },
    refresh: {
      async handler(ctx, params) {
        const { dataLoadingMode } = ctx.model.props;
        if (dataLoadingMode === 'auto') {
          await ctx.model.applySubModelsAutoFlows('grid');
          await ctx.model.resource.refresh();
          const data = ctx.model.resource.getData();
          ctx.model.setSharedContext({
            currentRecord: Array.isArray(data) ? data[0] : data,
          });
        } else {
          ctx.model.resource.loading = false;
        }
      },
    },
  },
});

DetailsModel.define({
  title: tval('Details'),
  group: 'Content',
  defaultOptions: {
    use: 'DetailsModel',
    subModels: {
      grid: {
        use: 'DetailsFieldGridModel',
      },
    },
  },
  sort: 300,
});
