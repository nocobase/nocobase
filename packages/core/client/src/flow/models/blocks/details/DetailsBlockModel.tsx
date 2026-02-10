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
import React, { useEffect, useRef } from 'react';
import { BlockGridModel, BlockSceneEnum, CollectionBlockModel, RecordActionModel } from '../../base';
import { FormComponent } from '../form/FormBlockModel';
import { DetailsGridModel } from './DetailsGridModel';
import { dispatchEventDeep } from '../../../utils';
import { useDetailsGridHeight } from './utils';

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
      await dispatchEventDeep(this, 'paginationChange');
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
    const { heightMode, height } = this.decoratorProps;
    return (
      <DetailsBlockContent
        model={this}
        gridModel={this.subModels.grid}
        isConfigMode={isConfigMode}
        heightMode={heightMode}
        height={height}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
        actions={
          <DndProvider>
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
          </DndProvider>
        }
      />
    );
  }
}

const DetailsBlockContent = ({
  model,
  gridModel,
  isConfigMode,
  heightMode,
  height,
  layoutProps,
  actions,
}: {
  model: DetailsBlockModel;
  gridModel: DetailsGridModel;
  isConfigMode: boolean;
  heightMode?: string;
  height?: number;
  layoutProps?: any;
  actions?: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
  const gridHeight = useDetailsGridHeight({
    heightMode,
    containerRef,
    actionsRef,
    paginationRef,
    deps: [height],
  });

  useEffect(() => {
    if (!gridModel) return;
    const nextHeight = isFixedHeight ? gridHeight : undefined;
    if (gridModel.props?.height === nextHeight && gridModel.props?.heightMode === heightMode) return;
    gridModel.setProps({ height: nextHeight, heightMode });
  }, [gridModel, gridHeight, isFixedHeight, heightMode]);

  const formStyle = isFixedHeight
    ? {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
      }
    : undefined;
  const containerStyle: any = isFixedHeight
    ? {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: 1,
      }
    : undefined;

  return (
    <FormComponent model={model} layoutProps={layoutProps} style={formStyle}>
      <div ref={containerRef} style={containerStyle}>
        <div
          ref={actionsRef}
          style={{
            textAlign: 'right',
            lineHeight: '0px',
            paddingBottom: isConfigMode && model.context.themeToken.padding,
          }}
        >
          {actions}
        </div>
        <FlowModelRenderer
          key={`${gridModel?.uid || 'details-grid'}:${isConfigMode ? 'design' : 'runtime'}`}
          model={gridModel}
          showFlowSettings={false}
        />
        <div ref={paginationRef}>{model.renderPagination()}</div>
      </div>
    </FormComponent>
  );
};

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

DetailsBlockModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    blockLinkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'blockLinkageRules',
        flowKey: 'cardSettings',
        stepKey: 'linkageRules',
      },
    },
    fieldslinkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'detailsFieldLinkageRules',
        flowKey: 'detailsSettings',
        stepKey: 'linkageRules',
      },
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
