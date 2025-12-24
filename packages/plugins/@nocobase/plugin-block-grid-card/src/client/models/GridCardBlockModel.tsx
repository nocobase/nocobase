/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DndProvider,
  MultiRecordResource,
  FlowModelRenderer,
  tExpr,
  Droppable,
  DragHandler,
  AddSubModelButton,
  FlowSettingsButton,
  FlowModel,
} from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel, BlockSceneEnum, ActionModel } from '@nocobase/client';
import React from 'react';
import { List, Space, Slider, Grid, InputNumber, Col } from 'antd';
import { css } from '@emotion/css';
import { GridCardItemModel } from './GridCardItemModel';
import { screenSizeTitleMaps, gridSizes, columnCountMarks, screenSizeMaps } from './utils';

type GridBlockModelStructure = {
  subModels: {
    item: GridCardItemModel;
    actions: ActionModel[];
  };
};

export class GridCardBlockModel extends CollectionBlockModel<GridBlockModelStructure> {
  static scene = BlockSceneEnum.many;
  _screens;
  _defaultCustomModelClasses = {
    CollectionActionGroupModel: 'CollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
    TableColumnModel: 'TableColumnModel',
    TableAssociationFieldGroupModel: 'TableAssociationFieldGroupModel',
    TableCustomColumnModel: 'TableCustomColumnModel',
  };

  get resource() {
    return super.resource as MultiRecordResource;
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const screens = Grid.useBreakpoint();
    const order = ['xxl', 'lg', 'md', 'xs'];
    this._screens = order.find((bp) => screens[bp]) || 'lg';
  }

  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }
  renderConfiguireActions() {
    return (
      <AddSubModelButton
        key={'table-column-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
  pagination() {
    const totalCount = this.resource.getMeta('count');
    const pageSize = this.resource.getPageSize();
    const hasNext = this.resource.getMeta('hasNext');
    const current = this.resource.getPage();
    const data = this.resource.getData();
    const columns = this.props.columnCount?.[this._screens] || 1;
    const rowCount = this.props.rowCount || 1;

    const multiples = [1, 2, 3, 5, 10];

    const pageSizeOptions = multiples.map((m) => columns * rowCount * m);

    if (totalCount) {
      return {
        current,
        pageSize,
        total: totalCount,
        pageSizeOptions: pageSizeOptions,
        showTotal: (total) => {
          return this.translate('Total {{count}} items', { count: total });
        },
        showSizeChanger: true,
        onChange: (page, pageSize) => {
          this.resource.loading = true;
          this.resource.setPage(page);
          this.resource.setPageSize(pageSize);
          this.resource.refresh();
        },
      };
    } else {
      return {
        // showTotal: false,
        simple: true,
        showTitle: false,
        showSizeChanger: true,
        hideOnSinglePage: false,
        pageSize,
        total: data?.length < pageSize || !hasNext ? pageSize * current : pageSize * current + 1,
        className: css`
          .ant-pagination-simple-pager {
            display: none !important;
          }
        `,
        itemRender: (_, type, originalElement) => {
          if (type === 'prev') {
            return (
              <div
                style={{ display: 'flex' }}
                className={css`
                  .ant-pagination-item-link {
                    min-width: ${this.context.themeToken.controlHeight}px;
                  }
                `}
              >
                {originalElement} <div>{this.resource.getPage()}</div>
              </div>
            );
          } else {
            return originalElement;
          }
        },
      };
    }
  }

  renderComponent() {
    const { columnCount } = this.props;
    const token = this.context.themeToken;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return (
      <>
        <DndProvider>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                // @ts-ignore
                if (action.props.position === 'left') {
                  return (
                    <FlowModelRenderer
                      key={action.uid}
                      model={action}
                      showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                    />
                  );
                }

                return null;
              })}
              {/* 占位 */}
              <span></span>
            </Space>
            <Space wrap>
              {this.mapSubModels('actions', (action) => {
                if (action.hidden && !isConfigMode) {
                  return;
                }
                // @ts-ignore
                if (action.props.position !== 'left') {
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
                }

                return null;
              })}
              {this.renderConfiguireActions()}
            </Space>
          </div>
        </DndProvider>
        <List
          {...this.props}
          pagination={this.pagination()}
          loading={this.resource?.loading}
          dataSource={this.resource.getData()}
          grid={{
            ...columnCount,
            sm: columnCount.xs,
            xl: columnCount.lg,
            gutter: [token.marginBlock / 2, token.marginBlock / 2],
          }}
          renderItem={(item, index) => {
            const model = this.subModels.item.createFork({}, `${index}`);
            model.context.defineProperty('record', {
              get: () => item,
              cache: false,
              resolveOnServer: true,
            });
            model.context.defineProperty('index', {
              get: () => index,
              cache: false,
              resolveOnServer: true,
            });
            return (
              <Col
                className={css`
                  height: 100%;
                  > div {
                    height: 100%;
                  }
                `}
              >
                <FlowModelRenderer model={model} />
              </Col>
            );
          }}
        />
      </>
    );
  }
}

GridCardBlockModel.registerFlow({
  key: 'resourceSettings2',
  steps: {},
});

GridCardBlockModel.registerFlow({
  key: 'GridCardSettings',
  sort: 500,
  title: tExpr('Grid card block settings', { ns: 'block-grid-card' }),
  steps: {
    columnCount: {
      title: tExpr('Set the count of columns displayed in a row'),
      uiSchema(ctx) {
        const t = ctx.t;
        const columnCountSchema = {
          'x-component': Slider,
          'x-decorator': 'FormItem',
          'x-component-props': {
            min: 1,
            max: 24,
            marks: columnCountMarks,
            tooltip: {
              formatter: (value) => `${value}${t('Column')}`,
            },
            step: null,
          },
        };

        const columnCountProperties = gridSizes.reduce((o, k) => {
          o[k] = {
            ...columnCountSchema,
            title: t(screenSizeTitleMaps[k]),
            description: `${t('Screen size')} ${screenSizeMaps[k]} ${t('pixels')}`,
          };
          return o;
        }, {});

        return {
          columnCount: {
            type: 'object',
            properties: columnCountProperties,
          },
        };
      },
      defaultParams: {
        columnCount: {
          xs: 1,
          md: 2,
          lg: 3,
          xxl: 4,
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({
          columnCount: params.columnCount,
        });
      },
    },
    rowCount: {
      title: tExpr('Number of Rows', { ns: 'block-grid-card' }),
      uiSchema: {
        rowCount: {
          'x-component': InputNumber,
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        rowCount: 3,
      },
      handler(ctx, params) {
        ctx.model.resource.loading = true;
        ctx.model.resource.setPage(1);
        const pageSize = params.rowCount * ctx.model.props.columnCount[ctx.model._screens];
        const currentPageSize = ctx.model.resource.getPageSize();
        if (currentPageSize !== pageSize) {
          ctx.model.resource.setPageSize(pageSize);
        }
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
      handler(ctx, params) {
        ctx.model.setProps({ ...params, labelWidth: params.layout === 'vertical' ? null : params.labelWidth });
        const item = ctx.model.subModels.item as FlowModel;
        item.setProps({
          ...params,
          labelWidth: params.layout === 'vertical' ? '100%' : params.labelWidth,
          labelWrap: params.layout === 'vertical' ? true : params.labelWrap,
        });
      },
    },
  },
});

GridCardBlockModel.define({
  label: tExpr('Grid Card'),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'GridCardBlockModel',
    subModels: {
      item: {
        use: 'GridCardItemModel',
      },
    },
  },
  sort: 500,
});
