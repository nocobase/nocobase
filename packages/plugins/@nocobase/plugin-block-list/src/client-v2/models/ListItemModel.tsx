/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createRecordResolveOnServerWithLocal,
  ForkFlowModel,
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
import { DetailsGridModel, FormComponent, ActionModel } from '@nocobase/client-v2';
import { Space } from 'antd';

type ListItemModelStructure = {
  subModels: {
    grid: DetailsGridModel;
    actions: ActionModel[];
  };
};

const recordIdentityByFork = new WeakMap<ForkFlowModel<FlowModel>, string>();

type CollectionLike = {
  filterTargetKey?: string | string[];
  getFilterByTK?: (record: Record<string, unknown>) => unknown;
  getFilterTargetKey?: () => string | string[];
};

function getRecordValue(record: unknown, key: string) {
  if (!record || typeof record !== 'object') return undefined;

  return (record as Record<string, unknown>)[key];
}

function getRecordIdentity(record: unknown, collection?: CollectionLike) {
  if (record && typeof record === 'object') {
    const filterByTk = collection?.getFilterByTK?.(record as Record<string, unknown>);

    if (typeof filterByTk !== 'undefined' && filterByTk !== null) {
      return String(filterByTk);
    }
  }

  const filterTargetKey = collection?.getFilterTargetKey?.() || collection?.filterTargetKey || 'id';
  const keys = Array.isArray(filterTargetKey) ? filterTargetKey : [filterTargetKey];
  const values = keys.map((key) => getRecordValue(record, key));

  return values.map((value) => String(value ?? '')).join('-');
}

export class ListItemModel extends FlowModel<ListItemModelStructure> {
  onInit(options: any): void {
    super.onInit(options);
  }
  renderConfigureAction() {
    return (
      <AddSubModelButton
        key="table-row-actions-add"
        model={this}
        subModelBaseClass={this.context.getModelClassName('RecordActionGroupModel')}
        subModelKey="actions"
        afterSubModelInit={async (actionModel) => {
          actionModel.setStepParams('buttonSettings', 'general', { type: 'link', icon: null });
        }}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  render() {
    const index = this.context.index;
    const record = this.context.record;
    const grid = this.subModels.grid.createFork({}, `grid-${index}`) as any;
    const token = this.context.themeToken;

    grid.gridContainerRef = React.createRef<HTMLDivElement>();
    const gridRecordMeta: PropertyMetaFactory = createRecordMetaFactory(
      () => grid.context.collection,
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
      meta: gridRecordMeta,
    });
    grid.context.defineProperty('fieldKey', {
      get: () => index,
    });
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <div
        key={this.context.index}
        style={{ width: '100%' }}
        className={css`
          .ant-form-item {
            margin-bottom: ${token.marginXXS}px;
          }
        `}
      >
        <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
          <FlowModelRenderer model={grid as any} showFlowSettings={false} />
        </FormComponent>
        <div>
          <DndProvider>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space wrap>
                {this.mapSubModels('actions', (action, i) => {
                  if (action.hidden && !isConfigMode) {
                    return;
                  }
                  const slotKey = `${getRecordValue(record, '__index') ?? index}`;
                  const recordIdentity = getRecordIdentity(record, this.context.collection);
                  const cachedFork = action.getFork?.(slotKey);

                  if (cachedFork && recordIdentityByFork.get(cachedFork) !== recordIdentity) {
                    cachedFork.dispose();
                  }

                  const fork = action.createFork({}, slotKey);
                  recordIdentityByFork.set(fork, recordIdentity);
                  fork.invalidateFlowCache('beforeRender');
                  const actionRenderKey = `${fork.uid}-${slotKey}-${recordIdentity}`;

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
                    resolveOnServer: createRecordResolveOnServerWithLocal(
                      () => (fork.context as any).collection,
                      () => record,
                    ),
                    meta: recordMeta,
                    cache: false,
                  });
                  return (
                    <Droppable model={fork} key={actionRenderKey}>
                      <div
                        className={css`
                          button {
                            padding: ${token.paddingXXS}px;
                            padding-left: ${i === 0 ? 0 : token.paddingXXS}px;
                          }
                        `}
                      >
                        <FlowModelRenderer
                          key={actionRenderKey}
                          model={fork}
                          inputArgs={record}
                          showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                          extraToolbarItems={[
                            {
                              key: 'drag-handler',
                              component: DragHandler,
                              sort: 1,
                            },
                          ]}
                        />
                      </div>
                    </Droppable>
                  );
                })}
                {this.renderConfigureAction()}
              </Space>
            </div>
          </DndProvider>
        </div>
      </div>
    );
  }
}

ListItemModel.define({
  createModelOptions: {
    use: 'ListItemModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
  sort: 350,
});
