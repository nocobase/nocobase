/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  PropertyMetaFactory,
  createRecordMetaFactory,
  DndProvider,
  Droppable,
  FlowModelRenderer,
  DragHandler,
  AddSubModelButton,
  FlowSettingsButton,
  FlowModel,
} from '@nocobase/flow-engine';
import React from 'react';
import { css } from '@emotion/css';
import { SettingOutlined } from '@ant-design/icons';
import { DetailsGridModel, FormComponent, ActionModel } from '@nocobase/client';
import { Space, Card } from 'antd';

type GridItemModelStructure = {
  subModels: {
    grid: DetailsGridModel;
    actions: ActionModel[];
  };
};

export class GridCardItemModel extends FlowModel<GridItemModelStructure> {
  onInit(options: any): void {
    super.onInit(options);
  }
  renderConfiguireActions() {
    return (
      <AddSubModelButton
        key="table-row-actions-add"
        model={this}
        subModelBaseClass={this.context.getModelClassName('RecordActionGroupModel')}
        subModelKey="actions"
        afterSubModelInit={async (actionModel) => {
          actionModel.setStepParams('buttonSettings', 'general', { type: 'link' });
        }}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  render() {
    const index = this.context.index;
    const record = this.context.record;
    const grid = this.subModels.grid.createFork({}, `grid-${index}`);

    // 重置 gridContainerRef，避免多个实例共享同一个 ref 引起的无法拖拽的问题
    (grid as any).gridContainerRef = React.createRef<HTMLDivElement>();

    const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
      () => (grid.context as any).collection,
      grid.context.t('Current record'),
      (ctx) => {
        const coll = ctx.collection;
        const rec = ctx.record;
        const name = coll?.name;
        const dataSourceKey = coll?.dataSourceKey;
        const filterByTk = coll?.getFilterByTK?.(rec);
        if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
        return { collection: name, dataSourceKey, filterByTk };
      },
    );
    grid.context.defineProperty('fieldIndex', {
      get: () => index,
      cache: false,
    });
    grid.context.defineProperty('record', {
      get: () => record,
      cache: false,
      resolveOnServer: true,
      meta: recordMeta,
    });
    grid.context.defineProperty('fieldKey', {
      get: () => index,
    });
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <Card bordered={false} role="button" aria-label="grid-card-item">
        <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
          <FlowModelRenderer model={grid as any} showFlowSettings={false} />
        </FormComponent>
        <div>
          <DndProvider>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Space
                className={css`
                  button {
                    padding: 5px;
                  }
                `}
                wrap
              >
                {this.mapSubModels('actions', (action) => {
                  const fork = action.createFork({}, `${index}`);
                  const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
                    () => (fork.context as any).collection,
                    fork.context.t('Current record'),
                    (ctx) => {
                      const coll = ctx.collection;
                      const rec = ctx.record;
                      const name = coll?.name;
                      const dataSourceKey = coll?.dataSourceKey;
                      const filterByTk = coll?.getFilterByTK?.(rec);
                      if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
                      return { collection: name, dataSourceKey, filterByTk };
                    },
                  );
                  fork.context.defineProperty('record', {
                    get: () => this.context.record,
                    resolveOnServer: true,
                    meta: recordMeta,
                    cache: false,
                  });

                  return (
                    <Droppable model={fork} key={fork.uid}>
                      <FlowModelRenderer
                        model={fork}
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
                {this.renderConfiguireActions()}
              </Space>
            </div>
          </DndProvider>
        </div>
      </Card>
    );
  }
}

GridCardItemModel.define({
  createModelOptions: {
    use: 'GridCardItemModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
  sort: 350,
});
