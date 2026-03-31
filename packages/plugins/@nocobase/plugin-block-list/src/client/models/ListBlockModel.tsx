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
  observer,
} from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel, BlockSceneEnum, ActionModel, dispatchEventDeep } from '@nocobase/client';
import React, { useMemo, useRef } from 'react';
import { List, Space } from 'antd';
import { css } from '@emotion/css';
import { ListItemModel } from './ListItemModel';
import { useListHeight } from './utils';

type ListBlockModelStructure = {
  subModels: {
    item: ListItemModel;
    actions: ActionModel[];
  };
};

export class ListBlockModel extends CollectionBlockModel<ListBlockModelStructure> {
  static scene = BlockSceneEnum.many;

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

  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }
  renderConfigureActions() {
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
    if (totalCount) {
      return {
        current,
        pageSize,
        total: totalCount,
        showTotal: (total) => {
          return this.translate('Total {{count}} items', { count: total });
        },
        showSizeChanger: true,
        onChange: async (page, pageSize) => {
          this.resource.loading = true;
          this.resource.setPage(page);
          this.resource.setPageSize(pageSize);
          await this.resource.refresh();
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
          await dispatchEventDeep(this, 'paginationChange');
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

  renderActions() {
    const flowSettingsEnabled = !!this.context.flowSettingsEnabled;

    if (!flowSettingsEnabled && !this.hasSubModel('actions')) {
      return;
    }

    return (
      <DndProvider>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Space>
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
              if (action.hidden && !flowSettingsEnabled) {
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
            {this.renderConfigureActions()}
          </Space>
        </div>
      </DndProvider>
    );
  }

  renderComponent() {
    const { heightMode, height } = this.decoratorProps;
    return <ListBlockContent model={this} heightMode={heightMode} height={height} />;
  }
}

const ListBlockContent = observer(
  ({ model, heightMode, height }: { model: ListBlockModel; heightMode?: string; height?: number }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
    const ctx = model.context;
    const token = ctx.themeToken;

    const listHeight = useListHeight({
      heightMode,
      containerRef,
      actionsRef,
      listRef,
      deps: [height],
    });
    const listClassName = useMemo(
      () => css`
        .ant-spin-nested-loading {
          height: var(--nb-list-height);
          overflow: auto;
          margin-left: -${token.marginLG}px;
          margin-right: -${token.marginLG}px;
          padding-left: ${token.marginLG}px;
          padding-right: ${token.marginLG}px;
        }
        .ant-spin-nested-loading > .ant-spin-container {
          min-height: 100%;
        }
      `,
      [],
    );
    const listStyle = useMemo(() => {
      if (listHeight == null) return model.props?.style;
      return {
        ...(model.props?.style || {}),
        ['--nb-list-height' as any]: `${listHeight}px`,
      };
    }, [listHeight, model.props?.style]);
    const containerStyle: any = isFixedHeight
      ? {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
        }
      : undefined;

    return (
      <div ref={containerRef} style={containerStyle}>
        <div ref={actionsRef}>{model.renderActions()}</div>
        <div ref={listRef} style={{ flex: 1, minHeight: 0 }}>
          <List
            {...model.props}
            className={model.props?.className ? `${model.props.className} ${listClassName}` : listClassName}
            style={listStyle}
            pagination={model.pagination()}
            loading={model.resource?.loading}
            dataSource={model.resource.getData()}
            renderItem={(item, index) => {
              const itemModel = model.subModels.item.createFork({}, `${index}`);
              itemModel.context.defineProperty('record', {
                get: () => item,
                cache: false,
              });
              itemModel.context.defineProperty('index', {
                get: () => index,
                cache: false,
              });
              return (
                <List.Item
                  key={index}
                  className={css`
                    > div {
                      width: 100%;
                    }
                  `}
                >
                  <FlowModelRenderer model={itemModel} />
                </List.Item>
              );
            }}
          />
        </div>
      </div>
    );
  },
);

ListBlockModel.registerFlow({
  key: 'resourceSettings2',
  steps: {},
});

ListBlockModel.registerFlow({
  key: 'listSettings',
  sort: 500,
  title: tExpr('List settings', { ns: 'block-list' }),
  steps: {
    pageSize: {
      title: tExpr('Page size'),
      uiMode: {
        type: 'select',
        key: 'pageSize',
        props: {
          options: [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
        },
      },
      defaultParams: {
        pageSize: 20,
      },
      handler(ctx, params) {
        ctx.model.resource.loading = true;
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(params.pageSize);
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
    refreshData: {
      title: tExpr('Refresh data'),
      async handler(ctx, params) {
        // await Promise.all(
        //   // ctx.model.mapSubModels('item', async (item: ListItemModel) => {
        //   //   try {
        //   //     await item?.applyAutoFlows?.();
        //   //   } catch (err) {
        //   //     item['__autoFlowError'] = err;
        //   //     // 列级错误不再向上抛，避免拖垮整表；在单元格层用 ErrorBoundary 展示
        //   //   }
        //   // }),
        // );
      },
    },
  },
});

ListBlockModel.registerFlow({
  key: 'paginationChange',
  on: 'paginationChange',
  steps: {
    linkageRulesRefresh: {
      use: 'linkageRulesRefresh',
      defaultParams: {
        actionName: 'blockLinkageRules',
        flowKey: 'cardSettings',
        stepKey: 'linkageRules',
      },
    },
  },
});

ListBlockModel.define({
  label: tExpr('List'),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'ListBlockModel',
    subModels: {
      item: {
        use: 'ListItemModel',
      },
    },
  },
  sort: 500,
});
