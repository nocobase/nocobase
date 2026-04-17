/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DetailsGridModel, FormComponent } from '@nocobase/client';
import {
  createRecordMetaFactory,
  FlowModel,
  FlowModelRenderer,
  PropertyMetaFactory,
  tExpr,
} from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { getKanbanRecordKey, normalizeKanbanCardOpenMode } from './utils';

const CARD_OPEN_MODE_OPTIONS = [
  { label: tExpr('Drawer', { ns: 'kanban' }), value: 'drawer' },
  { label: tExpr('Dialog', { ns: 'kanban' }), value: 'dialog' },
  { label: tExpr('Page', { ns: 'kanban' }), value: 'embed' },
];

type KanbanCardItemStructure = {
  subModels: {
    grid: DetailsGridModel;
  };
};

const getKanbanCardPersistentModel = (model: any) => {
  return model?.isFork ? model?.master || model : model;
};

const getKanbanCardPersistentParentModel = (model: any) => {
  const parentModel = model?.parent;
  return parentModel?.isFork ? parentModel?.master || parentModel : parentModel;
};

const syncKanbanCardModelProps = (model: any, props: Record<string, any>) => {
  model?.setProps?.(props);

  const persistentModel = getKanbanCardPersistentModel(model);
  if (persistentModel && persistentModel !== model) {
    persistentModel.setProps?.(props);
  }

  return persistentModel;
};

export class KanbanCardItemModel extends FlowModel<KanbanCardItemStructure> {
  render() {
    const index = this.context.index;
    const record = this.context.record;
    const onCardClick = this.context.onCardClick as (() => void) | undefined;
    const recordKey = getKanbanRecordKey(record, this.context.collection) || String(index);
    const cardScopeKey = String((this as any).forkId || this.uid || recordKey);
    const fieldIndex = [cardScopeKey];
    const grid = this.subModels.grid.createFork({}, `grid-${cardScopeKey}`) as any;

    grid.gridContainerRef = React.createRef<HTMLDivElement>();

    const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
      () => grid.context.collection,
      grid.context.t('Current record'),
      (ctx) => {
        const collection = ctx.collection;
        const currentRecord = ctx.record;
        const collectionName = collection?.name;
        const dataSourceKey = collection?.dataSourceKey;
        const filterByTk = collection?.getFilterByTK?.(currentRecord);

        if (!collectionName || filterByTk === undefined || filterByTk === null) {
          return undefined;
        }

        return { collection: collectionName, dataSourceKey, filterByTk };
      },
    );

    grid.context.defineProperty('fieldIndex', {
      get: () => fieldIndex,
      cache: false,
    });
    grid.context.defineProperty('collection', {
      get: () => this.context.collection,
      cache: false,
    });
    grid.context.defineProperty('record', {
      get: () => record,
      cache: false,
      resolveOnServer: true,
      meta: recordMeta,
    });
    grid.context.defineProperty('fieldKey', {
      get: () => cardScopeKey,
      cache: false,
    });

    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const clickEnabled = this.props.enableCardClick !== false;
    const clickable = clickEnabled && !!onCardClick;
    const handleCardClick = clickable
      ? (event: React.MouseEvent<HTMLElement>) => {
          const target = event.target as HTMLElement | null;
          const interactiveAncestor = target?.closest(
            'a, button, input, textarea, select, option, [role="button"], [contenteditable="true"]',
          );
          if (event.defaultPrevented || (interactiveAncestor && interactiveAncestor !== event.currentTarget)) {
            return;
          }

          onCardClick?.();
        }
      : undefined;

    const formLabelWidth = layout === 'horizontal' ? labelWidth : null;

    return (
      <Card
        hoverable={clickable}
        role={clickable ? 'button' : undefined}
        onClick={handleCardClick}
        className={css`
          height: 100%;
          cursor: ${clickable ? 'pointer' : 'default'};

          .ant-card-body {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .ant-form-item {
            margin-bottom: 6px;
          }
        `}
      >
        <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth: formLabelWidth, labelWrap, layout }}>
          <FlowModelRenderer
            key={cardScopeKey}
            model={grid}
            showFlowSettings={false}
            inputArgs={{ record, fieldIndex, fieldKey: cardScopeKey }}
            useCache={false}
          />
        </FormComponent>
      </Card>
    );
  }
}

KanbanCardItemModel.registerFlow({
  key: 'cardSettings',
  sort: 500,
  title: tExpr('Card settings', { ns: 'kanban' }),
  steps: {
    click: {
      title: tExpr('Enable click-to-open', { ns: 'kanban' }),
      uiMode: { type: 'switch', key: 'enableCardClick' },
      defaultParams(ctx) {
        return {
          enableCardClick: ctx.model.props.enableCardClick ?? true,
        };
      },
      handler(ctx, params) {
        syncKanbanCardModelProps(ctx.model, {
          enableCardClick: params.enableCardClick !== false,
        });
      },
    },
    openMode: {
      title: tExpr('Open mode', { ns: 'kanban' }),
      uiMode: {
        type: 'select',
        key: 'openMode',
        props: {
          options: CARD_OPEN_MODE_OPTIONS,
        },
      },
      defaultParams(ctx) {
        return {
          openMode: normalizeKanbanCardOpenMode(ctx.model.props.openMode || ctx.model.parent?.props?.cardOpenMode),
        };
      },
      async handler(ctx, params) {
        syncKanbanCardModelProps(ctx.model, {
          openMode: normalizeKanbanCardOpenMode(params.openMode),
        });

        const parentModel = getKanbanCardPersistentParentModel(ctx.model);
        await parentModel?.syncCardViewAction?.(parentModel?.subModels?.cardViewAction);
      },
    },
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
      handler(ctx, params) {
        const persistentModel = syncKanbanCardModelProps(ctx.model, {
          ...params,
          labelWidth: params.layout === 'vertical' ? null : params.labelWidth,
        });

        (persistentModel?.subModels?.grid as any)?.findSubModel('items', (itemModel: any) => {
          itemModel.setProps({
            ...params,
            labelWidth: params.layout === 'vertical' ? '100%' : params.labelWidth,
            labelWrap: params.layout === 'vertical' ? true : params.labelWrap,
          });
        });
      },
    },
  },
});
KanbanCardItemModel.define({
  createModelOptions: {
    use: 'KanbanCardItemModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
  sort: 360,
});
