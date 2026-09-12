/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DetailsGridModel, FormComponent } from '@nocobase/client-v2';
import { createRecordMetaFactory, FlowModel, FlowModelRenderer, PropertyMetaFactory } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { tExpr } from '../locale';
import {
  normalizeKanbanPopupTargetUid,
  normalizeKanbanPopupTemplateUid,
  resolveKanbanOpenViewDefaultParams,
} from './popupSettings';
import { getKanbanRecordKey, normalizeKanbanCardOpenMode, normalizeKanbanPopupSize } from './utils';

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

const hasOwnModelProp = (props: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(props, key);

const getKanbanCardPopupProp = (model: any, key: string, parentKey: string) => {
  if (hasOwnModelProp(model?.props || {}, key)) {
    return model?.props?.[key];
  }

  return model?.parent?.props?.[parentKey];
};

const replaceModelStepParams = (model: any, flowKey: string, stepKey: string, params: Record<string, any>) => {
  if (!model) {
    return;
  }

  model.stepParams = model.stepParams || {};
  model.stepParams[flowKey] = model.stepParams[flowKey] || {};
  model.stepParams[flowKey][stepKey] = { ...params };
  model.emitter?.emit?.('onStepParamsChanged');
};

const getModelStepParams = (model: any, flowKey: string, stepKey: string) => {
  const stepParams = model?.stepParams?.[flowKey]?.[stepKey];
  if (stepParams) {
    return stepParams;
  }

  try {
    return model?.getStepParams?.(flowKey, stepKey) || {};
  } catch {
    return {};
  }
};

const isKanbanPopupTemplateCopyMode = (params?: Record<string, any>) => {
  return params?.popupTemplateContext === true;
};

const hasKanbanPopupTemplateState = (params?: Record<string, any>) => {
  if (!params || typeof params !== 'object') {
    return false;
  }

  return !!normalizeKanbanPopupTemplateUid(params.popupTemplateUid) || params.popupTemplateContext === true;
};

const POPUP_TEMPLATE_SETTING_KEYS = [
  'uid',
  'dataSourceKey',
  'collectionName',
  'associationName',
  'filterByTk',
  'sourceId',
  'popupTemplateUid',
  'popupTemplateMode',
  'popupTemplateContext',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
];

const mergeKanbanCardPopupTemplateSettings = (
  baseSettings: Record<string, any>,
  popupSettings?: Record<string, any>,
) => {
  if (!hasKanbanPopupTemplateState(popupSettings)) {
    return baseSettings;
  }

  const nextSettings = { ...baseSettings };
  POPUP_TEMPLATE_SETTING_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(popupSettings, key)) {
      nextSettings[key] = popupSettings[key];
    }
  });

  if (popupSettings?.popupTemplateContext === true) {
    delete nextSettings.popupTemplateUid;
    delete nextSettings.popupTemplateHasFilterByTk;
    delete nextSettings.popupTemplateHasSourceId;
  } else if (popupSettings?.popupTemplateUid) {
    delete nextSettings.popupTemplateContext;
  }

  return nextSettings;
};

const getKanbanCardPopupActionSettings = (model: any, action?: any) => {
  const parentModel = getKanbanCardPersistentParentModel(model);
  return getModelStepParams(action || parentModel?.subModels?.cardViewAction, 'popupSettings', 'openView');
};

const ensureKanbanCardPopupAction = async (model: any) => {
  const parentModel = getKanbanCardPersistentParentModel(model);
  if (typeof parentModel?.ensureCardViewAction === 'function') {
    return await parentModel.ensureCardViewAction();
  }

  return parentModel?.subModels?.cardViewAction;
};

const buildKanbanCardPopupSettingsFromAction = (model: any, baseSettings: Record<string, any>, action?: any) => {
  const actionParams = getKanbanCardPopupActionSettings(model, action);
  if (Object.keys(actionParams).length === 0) {
    return baseSettings;
  }

  const popupSettings = {
    ...baseSettings,
    ...actionParams,
    uid: actionParams.uid || baseSettings.uid,
    collectionName: actionParams.collectionName || baseSettings.collectionName,
    dataSourceKey: actionParams.dataSourceKey || baseSettings.dataSourceKey,
  };

  return mergeKanbanCardPopupTemplateSettings(popupSettings, actionParams);
};

const applyKanbanCardPopupSettings = async (
  model: any,
  params: Record<string, any>,
  options: { persist?: boolean } = {},
) => {
  const parentModel = getKanbanCardPersistentParentModel(model);
  const nextPopupTemplateUid = normalizeKanbanPopupTemplateUid(params.popupTemplateUid);
  const nextPopupTargetUid = normalizeKanbanPopupTargetUid(params.uid);
  const currentPopupTemplateUid = normalizeKanbanPopupTemplateUid(
    getKanbanCardPopupProp(model, 'popupTemplateUid', 'cardPopupTemplateUid'),
  );
  const currentPopupTargetUid = normalizeKanbanPopupTargetUid(
    getKanbanCardPopupProp(model, 'popupTargetUid', 'cardPopupTargetUid'),
  );
  const resolvedPopupTargetUid =
    !nextPopupTemplateUid &&
    !isKanbanPopupTemplateCopyMode(params) &&
    currentPopupTemplateUid &&
    nextPopupTargetUid === currentPopupTargetUid
      ? undefined
      : nextPopupTargetUid;
  const normalizedParams = {
    ...params,
    mode: normalizeKanbanCardOpenMode(params.mode),
    size: normalizeKanbanPopupSize(params.size),
    popupTemplateUid: nextPopupTemplateUid,
    pageModelClass: params.pageModelClass || undefined,
    uid: resolvedPopupTargetUid,
  };
  const persistentModel = syncKanbanCardModelProps(model, {
    openMode: normalizedParams.mode,
    popupSize: normalizedParams.size,
    popupTemplateUid: normalizedParams.popupTemplateUid,
    pageModelClass: normalizedParams.pageModelClass,
    popupTargetUid: normalizedParams.uid,
  });

  replaceModelStepParams(model, 'cardSettings', 'popup', normalizedParams);
  if (persistentModel && persistentModel !== model) {
    replaceModelStepParams(persistentModel, 'cardSettings', 'popup', normalizedParams);
  }

  parentModel?.setProps?.({
    cardPopupPageModelClass: normalizedParams.pageModelClass,
  });
  if (options.persist) {
    await parentModel?.ensureCardViewAction?.({ persist: true });
  }
};

export class KanbanCardItemModel extends FlowModel<KanbanCardItemStructure> {
  render() {
    const index = this.context.index;
    const record = this.context.record;
    const onCardClick = this.context.onCardClick as (() => void) | undefined;
    const recordKey = getKanbanRecordKey(record, this.context.collection) || String(index);
    const cardScopeKey = String((this as any).forkId || this.uid || recordKey);
    // Keep the card fork scoped like a row-level field host so linkage/design settings
    // resolve against only this card after refreshes.
    const fieldIndex = [`${cardScopeKey}:0`];
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
    grid.context.defineProperty('flowSettingsEnabled', {
      get: () => !!this.context.flowSettingsEnabled,
      cache: false,
    });

    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const token = this.context.themeToken || {};
    const cardBodyPaddingTop = token.paddingContentVertical ?? 12;
    const cardBodyPaddingInline = token.paddingContentHorizontal ?? 16;
    const cardFieldGap = token.marginSM ?? 4;
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

          event.preventDefault();
          event.stopPropagation();
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
            padding: ${cardBodyPaddingTop}px ${cardBodyPaddingInline}px 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .ant-form-item {
            margin-bottom: ${cardFieldGap}px;
          }

          .ant-form-item:last-child {
            margin-bottom: 0;
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
    popup: {
      title: tExpr('Popup settings', { ns: 'kanban' }),
      use: 'openView',
      async defaultParams(ctx) {
        const commonParams = await resolveKanbanOpenViewDefaultParams(ctx as any);
        const action = await ensureKanbanCardPopupAction(ctx.model);
        return buildKanbanCardPopupSettingsFromAction(
          ctx.model,
          {
            ...commonParams,
            mode: normalizeKanbanCardOpenMode(getKanbanCardPopupProp(ctx.model, 'openMode', 'cardOpenMode')),
            size: normalizeKanbanPopupSize(getKanbanCardPopupProp(ctx.model, 'popupSize', 'cardPopupSize')),
            popupTemplateUid: normalizeKanbanPopupTemplateUid(
              getKanbanCardPopupProp(ctx.model, 'popupTemplateUid', 'cardPopupTemplateUid'),
            ),
            pageModelClass: getKanbanCardPopupProp(ctx.model, 'pageModelClass', 'cardPopupPageModelClass'),
            uid: normalizeKanbanPopupTargetUid(
              getKanbanCardPopupProp(ctx.model, 'popupTargetUid', 'cardPopupTargetUid'),
            ),
          },
          action,
        );
      },
      async handler(ctx, params) {
        await applyKanbanCardPopupSettings(ctx.model, params, { persist: false });
      },
      async beforeParamsSave(ctx, params, previousParams) {
        const action = await ensureKanbanCardPopupAction(ctx.model);
        const storedParams = getKanbanCardPopupActionSettings(ctx.model, action);
        await ctx.model
          ?.getAction?.('openView')
          ?.beforeParamsSave?.(ctx, params, Object.keys(storedParams).length > 0 ? storedParams : previousParams);
        await applyKanbanCardPopupSettings(ctx.model, params, { persist: true });
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
